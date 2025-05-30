<template>
    <div class="pa-2 pa-md-4 flex-grow-1 align-center justify-center d-flex flex-column">
        <div class="layout-content ma-auto">
            <slot/>
        </div>
        <div class="overline mt-4"></div>
    </div>
</template>

<script>
export default {
}
</script>

<style scoped>

.layout-content {
    width: 480px;
}
</style>
