<template>
	<div class="home-badges">
		<a href="https://github.com/MengXi-Studio/mengxi-ark/actions" target="_blank" rel="noreferrer">
			<img alt="CI" src="https://img.shields.io/github/actions/workflow/status/MengXi-Studio/mengxi-ark/ci.yml?branch=master&style=flat-square" />
		</a>
		<a href="https://github.com/MengXi-Studio/mengxi-ark/blob/master/LICENSE" target="_blank" rel="noreferrer">
			<img alt="License" src="https://img.shields.io/npm/l/%40mengxi-ark%2Futils?style=flat-square" />
		</a>
	</div>
</template>

<style scoped>
.home-badges {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 8px;
	margin-top: 16px;
	margin-bottom: 8px;
}

.home-badges img {
	display: block;
}
</style>
