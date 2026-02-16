
import asyncio
import os
import sys
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def run():
    # Path to python interpreter
    python = sys.executable
    # Path to server.py
    server_script = os.path.abspath("server.py")

    server_params = StdioServerParameters(
        command=python,
        args=[server_script],
        env=None
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            # List tools
            tools = await session.list_tools()
            print("Tools:", [t.name for t in tools.tools])

            # Call list_notebooks
            print("\nCalling list_notebooks...")
            try:
                result = await session.call_tool("list_notebooks", {})
                print("Result:")
                print(result.content[0].text)
            except Exception as e:
                print(f"Error calling tool: {e}")

if __name__ == "__main__":
    asyncio.run(run())
