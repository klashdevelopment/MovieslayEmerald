@echo off
echo "Movieslay Emerald // HLS Downloader"
echo "----------------------------------"
echo "This script will merge all .ts files in the current directory into a single .mp4 file using ffmpeg."
echo "Make sure all the .ts files you want to merge are in this directory and named in the format 'chunk0.ts', 'chunk1.ts', etc."
echo ""
echo "You can also play each .ts file individually, but merging them will allow you to have a single video file that can be played in any media player."
echo ""
echo "Checking for ffmpeg..."   

where ffmpeg >nul 2>&1
if errorlevel 1 (
    echo "ffmpeg could not be found. Please install ffmpeg to merge video chunks."
    echo ""
    echo "You may install ffmpeg system-wide, or for the simplest solution,"
    echo "download the static files and move 'ffmpeg' or 'ffmpeg.exe' to this same directory."
    echo "Windows: https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
    echo "All OS: https://github.com/BtbN/FFmpeg-Builds/releases/tag/latest"
    echo ""
    echo "Once ffmpeg is installed, run this script again to merge the video chunks."
    exit
)

if exist output.mp4 (
    echo "Removing existing output.mp4..."
    del output.mp4
)
if exist output.mkv (
    echo "Removing existing output.mkv..."
    del output.mkv
)
if exist filelist.txt (
    echo "Removing existing filelist.txt..."
    del filelist.txt
)
echo "Creating file list for ffmpeg..."
(for %%i in (chunk*.ts) do @echo file '%%i') > filelist.txt

set /p output_format="Do you want to output as MP4 (1) or MKV (2)? (default is MP4): "
if "%output_format%"=="2" (
    set output_file=output.mkv
) else (
    set output_file=output.mp4
)

echo "Merging video chunks into %output_file%..."
ffmpeg -f concat -safe 0 -i filelist.txt -c copy "%output_file%"

echo "Merge complete! Output file: %output_file%"
echo "------------------------------"