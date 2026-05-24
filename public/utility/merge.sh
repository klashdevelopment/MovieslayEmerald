#!/bin/bash
echo "Movieslay Emerald // HLS Downloader"
echo "----------------------------------"
echo "This script will merge all .ts files in the current directory into a single .mp4 file using ffmpeg."
echo "Make sure all the .ts files you want to merge are in this directory and named in the format 'chunk0.ts', 'chunk1.ts', etc."
echo ""
echo "You can also play each .ts file individually, but merging them will allow you to have a single video file that can be played in any media player."
echo ""
echo "Checking for ffmpeg..."

if ! command -v ffmpeg &> /dev/null
then
    echo "ffmpeg could not be found. Please install ffmpeg to merge video chunks."
    echo ""
    echo "You may install ffmpeg system-wide, or for the simplest solution,"
    echo "download the static files and move 'ffmpeg' or 'ffmpeg.exe' to this same directory."
    echo "Windows: https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
    echo "All OS: https://github.com/BtbN/FFmpeg-Builds/releases/tag/latest"
    echo ""
    echo "Once ffmpeg is installed, run this script again to merge the video chunks."
    exit
fi

if [ -f output.mp4 ]; then
    echo "Removing existing output.mp4..."
    rm output.mp4
fi
if [ -f output.mkv ]; then
    echo "Removing existing output.mkv..."
    rm output.mkv
fi
if [ -f filelist.txt ]; then
    echo "Removing existing filelist.txt..."
    rm filelist.txt
fi

echo "Creating file list for ffmpeg..."
ls chunk*.ts | sort -V | sed "s/^/file '/;s/$/'/" > filelist.txt

echo "Do you want to output as MP4 (1) or MKV (2)? (default is MP4):"
read output_format
if [ "$output_format" == "2" ]; then
    output_file="output.mkv"
else
    output_file="output.mp4"
fi

echo "Merging video chunks into $output_file..."
ffmpeg -f concat -safe 0 -i filelist.txt -c copy "$output_file"

echo "Merge complete! Output file: $output_file"
echo "------------------------------"