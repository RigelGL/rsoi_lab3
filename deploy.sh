modules=("auth" "logger" "loyalty" "payment" "person" "reservation" "gateway" "web")

all_tests_passed=true

echo "Run all per-service tests"
for module in "${modules[@]}"; do
    printf "Testing %s... " "$module"

    if cd "$module"; then
        output=$(./test.sh 2>&1)
        if [ $? -eq 0 ]; then
            printf "ok\n"
        else
            echo "$output"
            printf "failed\n"
            all_tests_passed=false
            break
        fi
        cd - > /dev/null || exit
    else
        echo "Dir not found $module"
        all_tests_passed=false
        break
    fi
done

if [ "$all_tests_passed" = true ]; then
    printf "\nAll tests pass. Publishing all\n"
    for module in "${modules[@]}"; do
        printf "Publishing %s... " "$module"
        if cd "$module"; then
            if ./publish.sh; then
              printf "ok"
            else
                echo "error!"
            fi
            cd - > /dev/null || exit
        fi
    done
else
    printf "\nErrors in tests - no publish\n"
    exit 1
fi