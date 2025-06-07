./test-and-publish.sh
if [ $? -eq 0 ]; then
    printf "tested and published!\n"
    ./install.sh
else
    echo "Fail deploy!"
fi