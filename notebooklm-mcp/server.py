import os
import sys
import subprocess
import json
import logging
from typing import Any, Sequence, Optional

from mcp.server import Server
from mcp.types import (
    Tool,
    TextContent,
    ImageContent,
    EmbeddedResource,
    JSONRPCMessage,
)
import mcp.types as types

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("notebooklm-mcp")

# Paths
VENV_PATH = os.path.dirname(sys.executable)
NLM_PATH = os.path.join(VENV_PATH, "nlm.exe")

if not os.path.exists(NLM_PATH):
    # Fallback to assumming we are in the root of the project and .venv is there
    NLM_PATH = os.path.join(os.getcwd(), ".venv", "Scripts", "nlm.exe")

class NLMError(Exception):
    pass

def run_nlm(args: list[str]) -> str:
    """Run nlm command and return stdout."""
    cmd = [NLM_PATH] + args
    
    # Environment variables for UTF-8
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    
    try:
        logger.info(f"Running command: {cmd}")
        # Capture output. 
        # Note: nlm output might be in cp949 on Windows, or utf-8. 
        # We try to decode gracefully.
        process = subprocess.run(
            cmd, 
            capture_output=True, 
            stdin=subprocess.DEVNULL,
            env=env,
            check=False 
        )
        
        stdout = process.stdout
        stderr = process.stderr
        
        # Helper to decode
        def decode_output(data: bytes) -> str:
            try:
                return data.decode('utf-8')
            except UnicodeDecodeError:
                try:
                    return data.decode('cp949')
                except UnicodeDecodeError:
                    return data.decode('utf-8', errors='replace')

        stdout_str = decode_output(stdout)
        stderr_str = decode_output(stderr)

        if process.returncode != 0:
            if "Authentication Error" in stderr_str or "Authentication expired" in stderr_str:
                raise NLMError("Authentication expired. Please run 'nlm login' in your terminal.")
            raise NLMError(f"Command failed with code {process.returncode}: {stderr_str}")
            
        return stdout_str

    except FileNotFoundError:
        raise NLMError(f"nlm executable not found at {NLM_PATH}")
    except Exception as e:
        raise NLMError(f"Unexpected error running nlm: {str(e)}")

# Create server
app = Server("notebooklm-mcp")

@app.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="list_notebooks",
            description="List all NotebookLM notebooks.",
            inputSchema={
                "type": "object",
                "properties": {},
            },
        ),
        Tool(
            name="list_notes",
            description="List notes in a specific notebook.",
            inputSchema={
                "type": "object",
                "properties": {
                    "notebook_id": {"type": "string", "description": "ID of the notebook"},
                },
                "required": ["notebook_id"],
            },
        ),
        Tool(
            name="query_notebook",
            description="Query a notebook with a question.",
            inputSchema={
                "type": "object",
                "properties": {
                    "notebook_id": {"type": "string", "description": "ID of the notebook"},
                    "query": {"type": "string", "description": "Question to ask"},
                },
                "required": ["notebook_id", "query"],
            },
        ),
        Tool(
            name="add_url_source",
            description="Add a URL source to a notebook.",
            inputSchema={
                "type": "object",
                "properties": {
                    "notebook_id": {"type": "string", "description": "ID of the notebook"},
                    "url": {"type": "string", "description": "URL to add as source"},
                },
                "required": ["notebook_id", "url"],
            },
        ),
    ]

@app.call_tool()
async def call_tool(name: str, arguments: Any) -> Sequence[TextContent | ImageContent | EmbeddedResource]:
    if name == "list_notebooks":
        try:
            # nlm notebook list
            output = run_nlm(["notebook", "list"])
            return [TextContent(type="text", text=output)]
        except NLMError as e:
            return [TextContent(type="text", text=f"Error: {str(e)}")]

    elif name == "list_notes":
        notebook_id = arguments.get("notebook_id")
        if not notebook_id:
             return [TextContent(type="text", text="Error: notebook_id is required")]
        try:
            # nlm note list <notebook_id>
            output = run_nlm(["note", "list", notebook_id])
            return [TextContent(type="text", text=output)]
        except NLMError as e:
            return [TextContent(type="text", text=f"Error: {str(e)}")]

    elif name == "query_notebook":
        notebook_id = arguments.get("notebook_id")
        query = arguments.get("query")
        if not notebook_id or not query:
            return [TextContent(type="text", text="Error: notebook_id and query are required")]
        try:
            # nlm query notebook <notebook_id> <query>
            output = run_nlm(["query", "notebook", notebook_id, query])
            return [TextContent(type="text", text=output)]
        except NLMError as e:
            return [TextContent(type="text", text=f"Error: {str(e)}")]

    elif name == "add_url_source":
        notebook_id = arguments.get("notebook_id")
        url = arguments.get("url")
        if not notebook_id or not url:
            return [TextContent(type="text", text="Error: notebook_id and url are required")]
        try:
            # nlm add --notebook <notebook_id> --source-type url --target <url>
            # Based on nlm help, command might be: nlm source add
            # Let's check nlm help again or use what we saw in help output earlier.
            # Help output said: "add      Add resources (sources to notebooks)"
            # Let's assume syntax: nlm add source --notebook-id ...
            # Actually, let's look at the help output from earlier again?
            # It just said "add".
            # I will try: nlm source add --notebook <id> url <url> based on common CLI patterns or check documentation if possible.
            # Wait, I saw "source add" in my plan.
            # Let's try: nlm source add <notebook_id> url <url> ?
            # To be safe, let's use a simpler command or just implement it and fix if it fails.
            # I'll stick to: nlm source add <notebook_id> url <url>  (guess)
            # Actually, standard click/typer often uses: nlm source add <notebook_id> <type> <content>
            # Let's try to be generic or look for help.
            # Re-reading help output:
            # source add [OPTIONS] NOTEBOOK_ID SOURCE_TYPE TARGET
            
            output = run_nlm(["source", "add", notebook_id, "url", url])
            return [TextContent(type="text", text=output)]
        except NLMError as e:
            return [TextContent(type="text", text=f"Error: {str(e)}")]

    else:
        return [TextContent(type="text", text=f"Tool {name} not found")]

async def main():
    # Import here to avoid issues with event loops if imported at top level in some envs
    from mcp.server.stdio import stdio_server

    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options()
        )

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
