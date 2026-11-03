<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import { formatDateVi, formatMoneyVi, formatTimeVi, addDays } from '#lib/date';

	let { data, form }: PageProps = $props();

	let opportunities = $derived(data.dayData.opportunities);
	let currentDate = $derived(data.dayData.date);

	let prevDate = $derived(addDays(currentDate, -1));
	let nextDate = $derived(addDays(currentDate, 1));

	let totalOpportunities = $derived(opportunities.length);
	let totalBranches = $derived(opportunities.reduce((acc, o) => acc + o.branches.length, 0));
	let totalChosen = $derived(opportunities.filter((o) => o.branches.some((b) => b.is_chosen === 1)).length);

	// Quick input state for new opportunity
	let newOppTitle = $state('');
	let newOppTime = $state<number>(60);
	let newOppMoney = $state<number>(0);

	// Preset setters
	function setQuickTime(mins: number) {
		newOppTime = mins;
	}
	function setQuickMoney(amount: number) {
		newOppMoney = amount;
	}
</script>

<div class="space-y-6">
	<!-- Top Bar: Date Navigator & Status -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
		<div class="flex items-center gap-3">
			<a
				href="/day/{prevDate}"
				class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition"
				title="Ngày trước"
			>
				←
			</a>
			<div>
				<h1 class="text-xl font-bold text-slate-100 flex items-center gap-2">
					<span>{formatDateVi(currentDate)}</span>
				</h1>
				<p class="text-xs text-slate-400 mt-0.5 font-mono">{currentDate}</p>
			</div>
			<a
				href="/day/{nextDate}"
				class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition"
				title="Ngày sau"
			>
				→
			</a>
		</div>

		<!-- Action Links / Stats pill -->
		<div class="flex items-center gap-3">
			<div class="text-xs bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-slate-300">
				<span class="text-amber-400 font-bold">{totalChosen}</span>/{totalOpportunities} cơ hội đã chọn
				<span class="text-slate-500 mx-1">|</span>
				<span class="text-slate-300 font-semibold">{totalBranches}</span> nhánh
			</div>
			<a
				href="/day/{currentDate}/review"
				class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-semibold text-sm shadow-lg shadow-amber-500/10 transition"
			>
				<span>Xem 3 Đường Đi</span>
				<span>→</span>
			</a>
		</div>
	</div>

	{#if form?.message}
		<div class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
			<span>⚠️ {form.message}</span>
		</div>
	{/if}

	<!-- Fast Opportunity Creator -->
	<section class="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 shadow-sm">
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
				<span>➕</span> Thêm Cơ Hội Mới
			</h2>
			<span class="text-xs text-slate-500">Đặt bối cảnh + tài nguyên bạn có</span>
		</div>

		<form method="POST" action="?/addOpportunity" use:enhance class="space-y-4">
			<div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
				<div class="sm:col-span-6">
					<label for="opp-title" class="block text-xs font-medium text-slate-400 mb-1">Tên cơ hội / Bối cảnh</label>
					<input
						id="opp-title"
						type="text"
						name="title"
						bind:value={newOppTitle}
						required
						placeholder="vd: Chiều rảnh rỗi, Tối sau khi tan làm, Sáng cuối tuần..."
						class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
					/>
				</div>

				<div class="sm:col-span-3">
					<label for="opp-time" class="block text-xs font-medium text-slate-400 mb-1">Thời gian có sẵn</label>
					<div class="flex items-center gap-1.5">
						<input
							id="opp-time"
							type="number"
							name="time_minutes"
							bind:value={newOppTime}
							min="0"
							step="15"
							class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
						/>
						<span class="text-xs text-slate-400 font-medium">phút</span>
					</div>
					<!-- Fast preset pills -->
					<div class="flex items-center gap-1 mt-1.5 text-[11px]">
						<button type="button" onclick={() => setQuickTime(30)} class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-amber-300">30p</button>
						<button type="button" onclick={() => setQuickTime(60)} class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-amber-300">1h</button>
						<button type="button" onclick={() => setQuickTime(120)} class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-amber-300">2h</button>
						<button type="button" onclick={() => setQuickTime(180)} class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-amber-300">3h</button>
					</div>
				</div>

				<div class="sm:col-span-3">
					<label for="opp-money" class="block text-xs font-medium text-slate-400 mb-1">Tiền có sẵn</label>
					<div class="flex items-center gap-1.5">
						<input
							id="opp-money"
							type="number"
							name="money_amount"
							bind:value={newOppMoney}
							min="0"
							step="10000"
							class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
						/>
						<span class="text-xs text-slate-400 font-medium">đ</span>
					</div>
					<!-- Fast preset pills -->
					<div class="flex items-center gap-1 mt-1.5 text-[11px]">
						<button type="button" onclick={() => setQuickMoney(0)} class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-amber-300">0đ</button>
						<button type="button" onclick={() => setQuickMoney(30000)} class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-amber-300">30k</button>
						<button type="button" onclick={() => setQuickMoney(50000)} class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-amber-300">50k</button>
						<button type="button" onclick={() => setQuickMoney(100000)} class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-amber-300">100k</button>
					</div>
				</div>
			</div>

			<div class="flex justify-end pt-1">
				<button
					type="submit"
					class="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition"
				>
					Tạo Cơ Hội
				</button>
			</div>
		</form>
	</section>

	<!-- Opportunity List -->
	{#if opportunities.length === 0}
		<div class="p-10 text-center rounded-2xl border border-dashed border-slate-800 text-slate-500 bg-slate-900/20">
			<div class="text-4xl mb-3">🌱</div>
			<p class="text-base font-medium text-slate-400">Hôm nay chưa có cơ hội nào được ghi lại.</p>
			<p class="text-xs text-slate-500 mt-1">Hãy bắt đầu bằng cách thêm một khoảng thời gian hoặc nguồn lực bạn có ở form trên.</p>
		</div>
	{:else}
		<div class="space-y-5">
			{#each opportunities as opp (opp.id)}
				<div class="bg-slate-900/50 rounded-2xl border border-slate-800/90 overflow-hidden transition shadow-sm hover:border-slate-700">
					<!-- Opportunity Header -->
					<div class="p-4 bg-slate-900/80 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-3">
						<div class="flex items-center gap-3">
							<span class="w-2.5 h-2.5 rounded-full {opp.branches.some(b => b.is_chosen === 1) ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-slate-600'}"></span>
							<h3 class="font-bold text-base text-slate-100">{opp.title}</h3>
							<div class="flex items-center gap-2 text-xs">
								<span class="bg-slate-800 text-amber-300/90 px-2.5 py-0.5 rounded-full border border-slate-700/60 font-mono">
									⏱ {formatTimeVi(opp.time_minutes)}
								</span>
								{#if opp.money_amount > 0}
									<span class="bg-slate-800 text-emerald-300/90 px-2.5 py-0.5 rounded-full border border-slate-700/60 font-mono">
										💵 {formatMoneyVi(opp.money_amount)}
									</span>
								{/if}
							</div>
						</div>

						<form method="POST" action="?/deleteOpportunity" use:enhance class="inline">
							<input type="hidden" name="id" value={opp.id} />
							<button
								type="submit"
								onclick={(e) => { if (!confirm(`Xóa cơ hội "${opp.title}" và các nhánh con?`)) e.preventDefault(); }}
								class="text-xs text-slate-500 hover:text-rose-400 p-1.5 transition rounded-lg hover:bg-slate-800"
								title="Xóa cơ hội này"
							>
								✕ Xóa
							</button>
						</form>
					</div>

					<!-- Branches List -->
					<div class="p-4 space-y-2.5">
						{#if opp.branches.length === 0}
							<p class="text-xs text-slate-500 italic py-2">Chưa có nhánh nào. Hãy thêm ít nhất 2 nhánh để có sự đối chiếu ngã rẽ.</p>
						{:else}
							<div class="space-y-2">
								{#each opp.branches as branch (branch.id)}
									<div
										class="flex items-center justify-between p-3 rounded-xl border transition {branch.is_chosen === 1
											? 'bg-amber-500/10 border-amber-500/40 text-slate-100 shadow-sm shadow-amber-500/5'
											: 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'}"
									>
										<!-- Choose Form Action -->
										<form method="POST" action="?/chooseBranch" use:enhance class="flex items-center gap-3 flex-1 min-w-0">
											<input type="hidden" name="opportunity_id" value={opp.id} />
											<input type="hidden" name="branch_id" value={branch.id} />
											
											<button
												type="submit"
												class="w-5 h-5 rounded-full border flex items-center justify-center transition flex-shrink-0 {branch.is_chosen === 1
													? 'border-amber-400 bg-amber-400 text-slate-950 font-bold text-xs'
													: 'border-slate-600 hover:border-amber-400'}"
												title={branch.is_chosen === 1 ? 'Lựa chọn thực tế của bạn' : 'Bấm để chọn nhánh này'}
											>
												{#if branch.is_chosen === 1}✓{/if}
											</button>

											<div class="min-w-0 flex-1">
												<div class="flex items-center gap-2 flex-wrap">
													<span class="font-medium text-sm {branch.is_chosen === 1 ? 'text-amber-200' : 'text-slate-200'}">
														{branch.name}
													</span>
													{#if branch.is_chosen === 1}
														<span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
															Đã chọn thực tế
														</span>
													{/if}
												</div>

												<!-- Outcome & cost info -->
												<div class="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
													{#if branch.cost_time > 0}
														<span>Tốn: {formatTimeVi(branch.cost_time)}</span>
													{/if}
													{#if branch.cost_money > 0}
														<span>Tiêu: {formatMoneyVi(branch.cost_money)}</span>
													{/if}
													{#if branch.outcome}
														<span class="text-slate-300 italic">" {branch.outcome} "</span>
													{/if}
													
													<!-- Remaining diff calculation -->
													{#if branch.is_chosen === 1}
														{@const remainMoney = opp.money_amount - branch.cost_money}
														{@const remainTime = opp.time_minutes - branch.cost_time}
														{#if remainMoney > 0}
															<span class="text-emerald-400 font-mono font-medium">Thừa: {formatMoneyVi(remainMoney)}</span>
														{/if}
														{#if remainTime > 0}
															<span class="text-emerald-400 font-mono font-medium">Dư: {formatTimeVi(remainTime)}</span>
														{/if}
													{/if}
												</div>
											</div>
										</form>

										<!-- Delete branch -->
										<form method="POST" action="?/deleteBranch" use:enhance class="inline pl-2">
											<input type="hidden" name="id" value={branch.id} />
											<button
												type="submit"
												class="text-xs text-slate-500 hover:text-rose-400 p-1.5 transition rounded hover:bg-slate-800"
												title="Xóa nhánh này"
											>
												✕
											</button>
										</form>
									</div>
								{/each}
							</div>
						{/if}

						<!-- Quick Add Branch Form -->
						<form
							method="POST"
							action="?/addBranch"
							use:enhance
							class="pt-3 border-t border-slate-800/60 mt-3 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
						>
							<input type="hidden" name="opportunity_id" value={opp.id} />
							
							<div class="sm:col-span-5">
								<input
									type="text"
									name="name"
									required
									placeholder="Tên nhánh mới (vd: Đi bộ, Chơi game, Học bài...)"
									class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
								/>
							</div>

							<div class="sm:col-span-2">
								<input
									type="number"
									name="cost_time"
									min="0"
									step="15"
									defaultValue={opp.time_minutes}
									placeholder="Tốn phút"
									class="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
									title="Thời gian tiêu hao (phút)"
								/>
							</div>

							<div class="sm:col-span-2">
								<input
									type="number"
									name="cost_money"
									min="0"
									step="10000"
									defaultValue={0}
									placeholder="Tiêu tiền"
									class="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
									title="Tiền tiêu hao (VNĐ)"
								/>
							</div>

							<div class="sm:col-span-3 flex items-center gap-1.5">
								<input
									type="text"
									name="outcome"
									placeholder="Nhận lại (vd: vui, mệt)"
									class="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
								/>
								<button
									type="submit"
									class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs whitespace-nowrap border border-slate-700 transition"
								>
									+ Nhánh
								</button>
							</div>
						</form>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
