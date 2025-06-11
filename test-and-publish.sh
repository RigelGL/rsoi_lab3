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
    printf "\nAll unit tests pass. Test E2E...\n"

    output=$(./e2e.sh 2>&1)
    if [ $? -eq 0 ]; then
        printf "ok\n"
    else
        echo "$output"
        printf "failed\nErrors in E2E tests!\n"
        exit 1
    fi

    printf "\nAll tests pass. Publishing all\n"
    for module in "${modules[@]}"; do
        printf "Publishing %s... " "$module"
        if cd "$module"; then
            output=$(./publish.sh 2>&1)
            if [ $? -eq 0 ]; then
                printf "ok\n"
            else
                echo "$output"
                echo "error!"
            fi
            cd - > /dev/null || exit
        fi
    done
else
    printf "\nErrors in unit tests - no publish\n"
    exit 1
fi