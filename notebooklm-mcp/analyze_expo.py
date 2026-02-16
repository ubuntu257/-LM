
import asyncio
import os
import sys
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def run():
    python = sys.executable
    server_script = os.path.abspath("server.py")

    server_params = StdioServerParameters(
        command=python,
        args=[server_script],
        env=None
    )

    # Notebook ID from previous list: "222f385d-b97d-420a-88eb-662a8c1d2b81"
    # Title: "2026 놋쏘빅 박람회 프리미엄 운영 및 진열 전략 보고서" (Sounds like the one)
    notebook_id = "222f385d-b97d-420a-88eb-662a8c1d2b81"
    query = "유아 박람회 관련 내용을 자세히 분석해줘. 주요 전략과 특징을 요약해."

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            
            print(f"Querying notebook {notebook_id} with: '{query}'")
            try:
                result = await session.call_tool("query_notebook", {
                    "notebook_id": notebook_id,
                    "query": query
                })
                result_text = result.content[0].text
                print("\n--- Answer ---")
                print(result_text)
                with open("expo_analysis.txt", "w", encoding="utf-8") as f:
                    f.write(result_text)
            except Exception as e:
                print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(run())
