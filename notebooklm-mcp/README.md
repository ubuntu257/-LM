# NotebookLM MCP Server

This project implements a [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for Google NotebookLM, wrapping the `nlm` CLI tool.

## Features

- List notebooks (`list_notebooks`)
- List notes in a notebook (`list_notes`)
- Query a notebook (`query_notebook`)
- Add URL sources (`add_url_source`)

## Setup

1.  **Install Dependencies**:
    ```bash
    pip install mcp notebooklm-tools
    ```

2.  **Authenticate**:
    ```bash
    nlm login
    ```
    Follow the browser instructions to log in to your Google account.

3.  **Run Server**:
    Use with an MCP client like Claude Desktop:
    ```json
    {
      "mcpServers": {
        "notebooklm": {
          "command": "python",
          "args": ["path/to/server.py"]
        }
      }
    }
    ```

## Troubleshooting

If you encounter authentication errors, simply run `nlm login` again to refresh your credentials.
