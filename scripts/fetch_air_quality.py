"""Legacy entry point — delegates to scripts/ingest/build.py."""

from pathlib import Path
import runpy

if __name__ == "__main__":
    build = Path(__file__).resolve().parent / "ingest" / "build.py"
    runpy.run_path(str(build), run_name="__main__")
