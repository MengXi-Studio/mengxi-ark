import { afterEach, describe, expect, it, vi } from 'vitest'
import { useRequest } from '../index'

/** 等待一个宏任务，确保已 resolve 的 promise 链完整跑完 */
function flush(): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, 0))
}

afterEach(() => {
	vi.useRealTimers()
})

describe('useRequest', () => {
	it('默认 immediate 立即发起请求并回写 data', async () => {
		let resolve!: (value: string) => void
		const source = vi.fn(
			() =>
				new Promise<string>(r => {
					resolve = r
				})
		)
		const { data, loading } = useRequest(source)
		expect(source).toHaveBeenCalledTimes(1)
		expect(loading.value).toBe(true)
		resolve('ok')
		await flush()
		expect(data.value).toBe('ok')
		expect(loading.value).toBe(false)
	})

	it('immediate: false 不自动请求，run 手动触发', async () => {
		const source = vi.fn(async () => 'ok')
		const { data, loading, run } = useRequest(source, { immediate: false })
		expect(source).not.toHaveBeenCalled()
		await run()
		expect(source).toHaveBeenCalledTimes(1)
		expect(data.value).toBe('ok')
		expect(loading.value).toBe(false)
	})

	it('竞态保护：先发后至的旧响应被丢弃', async () => {
		let resolveFirst!: (value: number) => void
		let resolveSecond!: (value: number) => void
		const source = vi.fn((params?: number) =>
			params === 2
				? new Promise<number>(r => {
						resolveSecond = r
					})
				: new Promise<number>(r => {
						resolveFirst = r
					})
		)
		const { data, run } = useRequest<number, number>(source, { immediate: false })
		const first = run(1)
		const second = run(2)
		resolveFirst(111)
		await first
		resolveSecond(222)
		await second
		expect(data.value).toBe(222)
	})

	it('cancel 后 loading 复位且旧响应不回写', async () => {
		let resolve!: (value: string) => void
		const source = vi.fn(
			() =>
				new Promise<string>(r => {
					resolve = r
				})
		)
		const { data, loading, run, cancel } = useRequest(source, { immediate: false })
		const running = run()
		cancel()
		expect(loading.value).toBe(false)
		resolve('late')
		await running
		expect(data.value).toBe(null)
		expect(loading.value).toBe(false)
	})

	it('retry：失败后按配置自动重试并成功回写', async () => {
		let calls = 0
		const source = vi.fn(async () => {
			calls += 1
			if (calls <= 2) throw new Error('fail')
			return 'ok'
		})
		const { data, error, loading, run } = useRequest(source, {
			immediate: false,
			retry: { count: 3, interval: 10 }
		})
		await run()
		expect(source).toHaveBeenCalledTimes(3)
		expect(calls).toBe(3)
		expect(data.value).toBe('ok')
		expect(error.value).toBeUndefined()
		expect(loading.value).toBe(false)
	})

	it('retry：重试耗尽后写入 error 并复位 loading', async () => {
		const source = vi.fn(async () => {
			throw new Error('boom')
		})
		const { error, loading, run } = useRequest(source, {
			immediate: false,
			retry: { count: 2, interval: 5 }
		})
		await run()
		expect(source).toHaveBeenCalledTimes(3)
		expect(error.value).toBeInstanceOf(Error)
		expect(loading.value).toBe(false)
	})

	it('retry backoff：指数退避使重试间隔逐次翻倍', async () => {
		vi.useFakeTimers()
		let calls = 0
		const source = vi.fn(async () => {
			calls += 1
			if (calls < 3) throw new Error('x')
			return 'ok'
		})
		const { data, run } = useRequest(source, {
			immediate: false,
			retry: { count: 5, interval: 100, backoff: true }
		})
		const running = run()
		await vi.advanceTimersByTimeAsync(100)
		expect(calls).toBe(2)
		await vi.advanceTimersByTimeAsync(100)
		expect(calls).toBe(2)
		await vi.advanceTimersByTimeAsync(100)
		expect(calls).toBe(3)
		await running
		expect(data.value).toBe('ok')
	})

	it('cacheKey：命中缓存先同步回填 data 并缓存新结果', async () => {
		let resolve!: (value: string) => void
		const source = vi.fn(
			() =>
				new Promise<string>(r => {
					resolve = r
				})
		)
		const request = useRequest(source, { immediate: false, cacheKey: 'cache-key-1' })
		const first = request.run()
		resolve('first')
		await first
		expect(request.data.value).toBe('first')

		let resolveSecond!: (value: string) => void
		source.mockImplementation(
			() =>
				new Promise<string>(r => {
					resolveSecond = r
				})
		)
		request.run()
		expect(request.data.value).toBe('first')
		resolveSecond('second')
		await flush()
		expect(request.data.value).toBe('second')
		expect(source).toHaveBeenCalledTimes(2)
	})

	it('refresh 重放上次请求参数', async () => {
		const source = vi.fn(async (params?: number) => `v${params}`)
		const { run, refresh, data } = useRequest<string, number>(source, { immediate: false })
		await run(7)
		expect(data.value).toBe('v7')
		await refresh()
		expect(source).toHaveBeenLastCalledWith(7)
		expect(data.value).toBe('v7')
	})

	it('retry() 手动重试上次请求', async () => {
		let calls = 0
		const source = vi.fn(async () => {
			calls += 1
			if (calls === 1) throw new Error('fail')
			return 'ok'
		})
		const { run, retry, error, data } = useRequest(source, { immediate: false })
		await run()
		expect(error.value).toBeInstanceOf(Error)
		await retry()
		expect(source).toHaveBeenCalledTimes(2)
		expect(data.value).toBe('ok')
		expect(error.value).toBeUndefined()
	})

	it('onSuccess / onError 回调触发', async () => {
		const onSuccess = vi.fn()
		const onError = vi.fn()
		const ok = useRequest(async () => 'ok', { immediate: false, onSuccess })
		await ok.run()
		expect(onSuccess).toHaveBeenCalledTimes(1)
		expect(onSuccess).toHaveBeenCalledWith('ok', undefined)
		const fail = useRequest(
			async () => {
				throw new Error('x')
			},
			{ immediate: false, onError }
		)
		await fail.run()
		expect(onError).toHaveBeenCalledTimes(1)
	})
})
