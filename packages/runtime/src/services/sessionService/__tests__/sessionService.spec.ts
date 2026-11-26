import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSessionService } from '../index'

describe('sessionService', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})
	afterEach(() => {
		vi.useRealTimers()
		vi.restoreAllMocks()
	})

	it('onExpired / notifyExpired：广播全部钩子', () => {
		const service = createSessionService()
		const hookA = vi.fn()
		const hookB = vi.fn()
		service.onExpired(hookA)
		service.onExpired(hookB)

		service.notifyExpired()
		expect(hookA).toHaveBeenCalledTimes(1)
		expect(hookB).toHaveBeenCalledTimes(1)
	})

	it('startTokenRefresh：有效 token 持续按间隔调度', async () => {
		const service = createSessionService()
		const getToken = vi.fn(async () => 'token-1')
		const expiredHook = vi.fn()
		service.onExpired(expiredHook)

		service.startTokenRefresh(getToken, { intervalMs: 1000 })
		await vi.advanceTimersByTimeAsync(3500)

		expect(getToken).toHaveBeenCalledTimes(3)
		expect(expiredHook).not.toHaveBeenCalled()
	})

	it('startTokenRefresh：返回空 token 视为刷新失败 → 广播 expired 并停止调度', async () => {
		const service = createSessionService()
		const getToken = vi.fn(async () => null)
		const expiredHook = vi.fn()
		service.onExpired(expiredHook)

		service.startTokenRefresh(getToken, { intervalMs: 1000 })
		await vi.advanceTimersByTimeAsync(1500)

		expect(expiredHook).toHaveBeenCalledTimes(1)
		expect(getToken).toHaveBeenCalledTimes(1)

		await vi.advanceTimersByTimeAsync(5000)
		expect(getToken).toHaveBeenCalledTimes(1)
	})

	it('startTokenRefresh：getToken 抛错视为刷新失败 → 广播 expired 并停止调度', async () => {
		const service = createSessionService()
		const getToken = vi.fn(async () => {
			throw new Error('network error')
		})
		const expiredHook = vi.fn()
		service.onExpired(expiredHook)

		service.startTokenRefresh(getToken, { intervalMs: 500 })
		await vi.advanceTimersByTimeAsync(1000)

		expect(expiredHook).toHaveBeenCalledTimes(1)
		expect(getToken).toHaveBeenCalledTimes(1)
	})

	it('stopTokenRefresh：停止后续调度', async () => {
		const service = createSessionService()
		const getToken = vi.fn(async () => 'token-1')

		service.startTokenRefresh(getToken, { intervalMs: 1000 })
		await vi.advanceTimersByTimeAsync(1000)
		service.stopTokenRefresh()
		await vi.advanceTimersByTimeAsync(10000)

		expect(getToken).toHaveBeenCalledTimes(1)
	})

	it('startTokenRefresh：重复调用覆盖旧调度器', async () => {
		const service = createSessionService()
		const getTokenA = vi.fn(async () => 'a')
		const getTokenB = vi.fn(async () => 'b')

		service.startTokenRefresh(getTokenA, { intervalMs: 1000 })
		service.startTokenRefresh(getTokenB, { intervalMs: 1000 })
		await vi.advanceTimersByTimeAsync(2500)

		expect(getTokenA).not.toHaveBeenCalled()
		expect(getTokenB).toHaveBeenCalledTimes(2)
	})

	it('notifyExpired：钩子内再次注册不影响本轮广播', () => {
		const service = createSessionService()
		const lateHook = vi.fn()
		const firstHook = vi.fn(() => service.onExpired(lateHook))
		service.onExpired(firstHook)

		service.notifyExpired()
		expect(firstHook).toHaveBeenCalledTimes(1)
		expect(lateHook).not.toHaveBeenCalled()

		service.notifyExpired()
		expect(lateHook).toHaveBeenCalledTimes(1)
	})
})
