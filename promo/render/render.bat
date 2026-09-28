@echo off
cd /d C:\Users\RSH\Desktop\新网站\promo\render
node starfield.js 1920 1080 30 85 20260901 | ffmpeg -y -f rawvideo -pix_fmt rgb24 -s 1920x1080 -r 30 -i - -i bgm.wav -filter_complex_script filters_full_clean.txt -map [vout] -map 1:a -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart ..\promo_video.mp4
echo EXITCODE=%ERRORLEVEL%
