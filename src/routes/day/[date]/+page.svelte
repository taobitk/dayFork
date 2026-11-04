<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount, tick } from 'svelte';
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
	let newOppTime = $state<number>(90);
	let newOppMoney = $state<number>(50000);
	let newOppOtherText = $state('');

	// Collapsed state map: opp.id -> boolean (false = expanded, true = collapsed)
	let collapsedMap = $state<Record<string, boolean>>({});

	function toggleCollapse(id: string) {
		collapsedMap[id] = !collapsedMap[id];
		scheduleWireUpdate();
	}

	function setQuickTime(mins: number) {
		newOppTime = mins;
	}
	function setQuickMoney(amount: number) {
		newOppMoney = amount;
	}

	function updateWires() {
		if (typeof window === 'undefined') return;

		for (let i = 0; i < opportunities.length; i++) {
			const opp = opportunities[i];
			const isCollapsed = !!collapsedMap[opp.id];
			if (isCollapsed) continue;

			const chosen = opp.branches.find((b) => b.is_chosen === 1);
			const hubEl = document.getElementById(`opp-hub-${opp.id}`);
			const cardEl = chosen ? document.getElementById(`branch-${chosen.id}`) : null;

			// 1. Top wire (Opp -> Chosen branch)
			const svgTop = document.getElementById(`wire-top-${opp.id}`);
			const pathTop = document.getElementById(`path-wire-top-${opp.id}`);
			const dotTopStart = document.getElementById(`dot-top-start-${opp.id}`);
			const dotTopEnd = document.getElementById(`dot-top-end-${opp.id}`);

			if (hubEl && cardEl && svgTop && pathTop && dotTopStart && dotTopEnd) {
				const topSvgRect = svgTop.getBoundingClientRect();
				const hubRect = hubEl.getBoundingClientRect();
				const cardRect = cardEl.getBoundingClientRect();

				const hubCenterX = hubRect.left + hubRect.width / 2 - topSvgRect.left;
				const cardTopCenterX = cardRect.left + cardRect.width / 2 - topSvgRect.left;

				pathTop.setAttribute(
					'd',
					`M ${hubCenterX} 2 C ${hubCenterX} 22, ${cardTopCenterX} 22, ${cardTopCenterX} 42`
				);
				dotTopStart.setAttribute('cx', String(hubCenterX));
				dotTopEnd.setAttribute('cx', String(cardTopCenterX));
			}

			// 2. Bottom wire (Chosen branch -> Next Opp)
			const nextOpp = opportunities[i + 1];
			const nextHubEl = nextOpp ? document.getElementById(`opp-hub-${nextOpp.id}`) : null;
			const svgBottom = document.getElementById(`wire-bottom-${opp.id}`);
			const pathBottom = document.getElementById(`path-wire-bottom-${opp.id}`);
			const dotBottomStart = document.getElementById(`dot-bottom-start-${opp.id}`);
			const dotBottomEnd = document.getElementById(`dot-bottom-end-${opp.id}`);

			if (cardEl && nextHubEl && svgBottom && pathBottom && dotBottomStart && dotBottomEnd) {
				const bottomSvgRect = svgBottom.getBoundingClientRect();
				const cardRect = cardEl.getBoundingClientRect();
				const nextHubRect = nextHubEl.getBoundingClientRect();

				const cardBottomCenterX = cardRect.left + cardRect.width / 2 - bottomSvgRect.left;
				const nextHubCenterX = nextHubRect.left + nextHubRect.width / 2 - bottomSvgRect.left;

				pathBottom.setAttribute(
					'd',
					`M ${cardBottomCenterX} 2 C ${cardBottomCenterX} 22, ${nextHubCenterX} 22, ${nextHubCenterX} 42`
				);
				dotBottomStart.setAttribute('cx', String(cardBottomCenterX));
				dotBottomEnd.setAttribute('cx', String(nextHubCenterX));
			}
		}
	}

	function scheduleWireUpdate() {
		tick().then(() => {
			requestAnimationFrame(() => {
				updateWires();
				setTimeout(updateWires, 100);
			});
		});
	}

	onMount(() => {
		scheduleWireUpdate();
		window.addEventListener('resize', scheduleWireUpdate);
		return () => {
			window.removeEventListener('resize', scheduleWireUpdate);
		};
	});

	$effect(() => {
		// Recompute wires whenever opportunities change
		if (opportunities) {
			scheduleWireUpdate();
		}
	});
</script>

<div class="space-y-6 max-w-4xl mx-auto">
	<!-- Top Bar: Date Navigator & Status -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
		<div class="flex items-center gap-3">
			<a
				href="/day/{prevDate}"
				class="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 hover:text-stone-900 transition font-bold"
				title="Ngày trước"
			>
				←
			</a>
			<div>
				<h1 class="text-xl font-bold text-stone-900 flex items-center gap-2 font-serif">
					<span>{formatDateVi(currentDate)}</span>
				</h1>
				<p class="text-xs text-stone-500 mt-0.5 font-mono">{currentDate}</p>
			</div>
			<a
				href="/day/{nextDate}"
				class="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 hover:text-stone-900 transition font-bold"
				title="Ngày sau"
			>
				→
			</a>
		</div>

		<!-- Action Links / Stats pill -->
		<div class="flex items-center gap-3 flex-wrap">
			<div class="text-xs bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200 text-stone-700 font-mono">
				<span class="text-amber-700 font-bold">{totalChosen}</span>/{totalOpportunities} đã chọn
				<span class="text-stone-400 mx-1">|</span>
				<span class="text-stone-800 font-semibold">{totalBranches}</span> nhánh
			</div>
			<a
				href="/day/{currentDate}/review"
				class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-sm transition"
			>
				<span>Xem Ngã Rẽ</span>
				<span>→</span>
			</a>
		</div>
	</div>

	{#if form?.message}
		<div class="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
			<span>⚠️ {form.message}</span>
		</div>
	{/if}

	<!-- Creator Panel -->
	<section class="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-sm">
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-2">
				<span>➕</span> Thêm Cơ Hội Mới
			</h2>
			<span class="text-xs text-stone-400">Đặt bối cảnh + tài nguyên + ghi chú hoàn cảnh</span>
		</div>

		<form
			method="POST"
			action="?/addOpportunity"
			use:enhance={() => {
				return async ({ update }) => {
					await update();
					newOppTitle = '';
					newOppOtherText = '';
					scheduleWireUpdate();
				};
			}}
			class="space-y-3"
		>
			<div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
				<div class="sm:col-span-5">
					<label for="opp-title" class="block text-xs font-medium text-stone-600 mb-1">Bối cảnh cơ hội</label>
					<input
						id="opp-title"
						type="text"
						name="title"
						bind:value={newOppTitle}
						required
						placeholder="vd: Sáng cuối tuần thảnh thơi, Chiều làm việc..."
						class="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-amber-600"
					/>
				</div>

				<div class="sm:col-span-2">
					<label for="opp-time" class="block text-xs font-medium text-stone-600 mb-1">Thời gian</label>
					<div class="flex items-center gap-1">
						<input
							id="opp-time"
							type="number"
							name="time_minutes"
							bind:value={newOppTime}
							min="0"
							step="15"
							class="w-full bg-stone-50 border border-stone-300 rounded-xl px-2.5 py-2 text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-amber-600 font-mono"
						/>
						<span class="text-xs text-stone-500">phút</span>
					</div>
					<div class="flex items-center gap-1 mt-1 text-[10px]">
						<button type="button" onclick={() => setQuickTime(45)} class="px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 hover:text-amber-700">45p</button>
						<button type="button" onclick={() => setQuickTime(90)} class="px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 hover:text-amber-700">90p</button>
						<button type="button" onclick={() => setQuickTime(120)} class="px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 hover:text-amber-700">2h</button>
					</div>
				</div>

				<div class="sm:col-span-2">
					<label for="opp-money" class="block text-xs font-medium text-stone-600 mb-1">Tiền có sẵn</label>
					<div class="flex items-center gap-1">
						<input
							id="opp-money"
							type="number"
							name="money_amount"
							bind:value={newOppMoney}
							min="0"
							step="5000"
							class="w-full bg-stone-50 border border-stone-300 rounded-xl px-2.5 py-2 text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-amber-600 font-mono"
						/>
						<span class="text-xs text-stone-500">đ</span>
					</div>
					<div class="flex items-center gap-1 mt-1 text-[10px]">
						<button type="button" onclick={() => setQuickMoney(0)} class="px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 hover:text-amber-700">0đ</button>
						<button type="button" onclick={() => setQuickMoney(50000)} class="px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 hover:text-amber-700">50k</button>
						<button type="button" onclick={() => setQuickMoney(100000)} class="px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 hover:text-amber-700">100k</button>
					</div>
				</div>

				<div class="sm:col-span-3">
					<label for="opp-other" class="block text-xs font-medium text-stone-600 mb-1">Ghi chú khác (mệt, mưa...)</label>
					<input
						id="opp-other"
						type="text"
						name="other_text"
						bind:value={newOppOtherText}
						placeholder="vd: Trời se lạnh, đang mệt..."
						class="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-amber-600"
					/>
				</div>
			</div>

			<div class="flex justify-end pt-1">
				<button
					type="submit"
					class="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs tracking-wide transition shadow-sm"
				>
					+ Ghim Cơ Hội
				</button>
			</div>
		</form>
	</section>

	<!-- Timeline Stream -->
	{#if opportunities.length === 0}
		<div class="p-12 text-center rounded-2xl border border-dashed border-stone-300 text-stone-400 bg-white/60">
			<div class="text-4xl mb-3">🌱</div>
			<p class="text-base font-medium text-stone-700 font-serif">Hôm nay chưa có cơ hội nào được ghi lại.</p>
			<p class="text-xs text-stone-500 mt-1">Hãy bắt đầu bằng cách ghim một khoảng thời gian hoặc bối cảnh ở khung trên.</p>
		</div>
	{:else}
		<div class="flex flex-col items-center w-full space-y-0">
			{#each opportunities as opp, idx (opp.id)}
				{@const isCollapsed = !!collapsedMap[opp.id]}
				{@const chosenBranch = opp.branches.find((b) => b.is_chosen === 1)}
				{@const hasSelection = !!chosenBranch}

				<div class="w-full flex flex-col items-center" id="block-{opp.id}">
					<!-- Opportunity Card -->
					{#if isCollapsed}
						<!-- Compact 1-line bar (Hình 4) -->
						<div
							class="opp-compact-bar"
							id="opp-hub-{opp.id}"
							onclick={() => toggleCollapse(opp.id)}
							onkeydown={(e) => { if (e.key === 'Enter') toggleCollapse(opp.id); }}
							role="button"
							tabindex="0"
						>
							<div class="flex items-center gap-2.5 min-w-0">
								<span class="w-2 h-2 rounded-full {hasSelection ? 'bg-amber-500' : 'bg-stone-400'}"></span>
								<span class="font-bold text-sm text-stone-900 truncate">{opp.title}</span>
							</div>

							<div class="flex items-center gap-2 flex-shrink-0 text-xs font-mono">
								<span class="pill-resource">⏱ {opp.time_minutes}p • 💵 {formatMoneyVi(opp.money_amount)}</span>
								{#if opp.other_text}
									<span class="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full text-[11px] font-sans border border-amber-200">
										📌 {opp.other_text}
									</span>
								{/if}
								{#if chosenBranch}
									<span class="hidden sm:inline text-amber-700 font-sans font-semibold text-xs">
										✓ {chosenBranch.name}
									</span>
								{/if}
								<span class="text-stone-400 hover:text-stone-800 text-xs px-1">▼</span>
							</div>
						</div>
					{:else}
						<!-- Full Expanded Unified Note (Hình 1) -->
						<div class="unified-note opp-parent-card" id="opp-hub-{opp.id}">
							<div class="note-badge-tag">CƠ HỘI #{idx + 1}</div>

							<div class="note-header-row">
								<div class="note-icon-circle">⏱</div>
								<div class="note-title-text">{opp.title}</div>
							</div>

							{#if opp.other_text}
								<div class="note-subtitle-text">"{opp.other_text}"</div>
							{:else}
								<div class="note-subtitle-text text-stone-400">Chưa có ghi chú hoàn cảnh</div>
							{/if}

							<div class="note-dashed-divider"></div>

							<div class="note-footer-row">
								<span class="pill-resource">{opp.time_minutes}p • {formatMoneyVi(opp.money_amount)}</span>
								<div class="flex items-center gap-3">
									<button
										type="button"
										onclick={() => toggleCollapse(opp.id)}
										class="text-action-link hover:text-stone-900 cursor-pointer"
									>
										Thu gọn ▲
									</button>
									<form method="POST" action="?/deleteOpportunity" use:enhance class="inline">
										<input type="hidden" name="id" value={opp.id} />
										<button
											type="submit"
											onclick={(e) => {
												if (!confirm(`Xóa cơ hội "${opp.title}" và toàn bộ nhánh con?`)) {
													e.preventDefault();
												}
											}}
											class="text-stone-400 hover:text-rose-600 text-xs transition"
											title="Xóa cơ hội này"
										>
											✕
										</button>
									</form>
								</div>
							</div>
						</div>

						<!-- TOP WIRE (Parent Opp -> Chosen Branch) -->
						{#if chosenBranch}
							<svg class="wire-box" id="wire-top-{opp.id}">
								<circle id="dot-top-start-{opp.id}" class="wire-dot" cx="0" cy="2" r="4.5" />
								<path id="path-wire-top-{opp.id}" class="wire-line" d="M 0 0 L 0 44" />
								<circle id="dot-top-end-{opp.id}" class="wire-dot" cx="0" cy="42" r="4.5" />
							</svg>
						{:else}
							<div class="straight-stem-line my-2"></div>
						{/if}

						<!-- Branches Grid (Hình 1, 3) -->
						<div class="branches-grid {hasSelection ? 'has-selection' : ''}" id="grid-{opp.id}">
							{#each opp.branches as branch (branch.id)}
								{@const isThisChosen = branch.is_chosen === 1}

								{#if isThisChosen}
									{@const remainTime = opp.time_minutes - branch.cost_time}
									{@const remainMoney = opp.money_amount - branch.cost_money}
									<!-- Chosen Branch Card (Hình 3) -->
									<div class="unified-note branch-card chosen" id="branch-{branch.id}">
										<div class="note-badge-tag">THỰC TẾ</div>

										<div class="note-header-row">
											<div class="note-icon-circle">✓</div>
											<div class="note-title-text">{branch.name}</div>
										</div>

										{#if branch.outcome}
											<div class="note-subtitle-text">"{branch.outcome}"</div>
										{/if}

										<div class="note-dashed-divider"></div>

										<div class="note-footer-row">
											<span class="pill-resource font-mono">{branch.cost_time}p • {formatMoneyVi(branch.cost_money)}</span>

											<div class="flex items-center gap-2">
												{#if remainTime > 0 || remainMoney > 0}
													<span class="pill-surplus font-mono">
														{#if remainMoney > 0}+{formatMoneyVi(remainMoney)}{/if}
														{#if remainMoney > 0 && remainTime > 0} • {/if}
														{#if remainTime > 0}+{remainTime}p{/if}
													</span>
												{/if}

												<form method="POST" action="?/deleteBranch" use:enhance class="inline">
													<input type="hidden" name="id" value={branch.id} />
													<button
														type="submit"
														onclick={(e) => {
															if (!confirm(`Xóa nhánh "${branch.name}"?`)) e.preventDefault();
														}}
														class="text-stone-400 hover:text-rose-600 text-xs ml-1"
														title="Xóa nhánh"
													>
														✕
													</button>
												</form>
											</div>
										</div>
									</div>
								{:else}
									<!-- Unchosen Branch Card -->
									<div class="unified-note branch-card" id="branch-{branch.id}">
										<form
											method="POST"
											action="?/chooseBranch"
											use:enhance={() => {
												return async ({ update }) => {
													await update();
													scheduleWireUpdate();
												};
											}}
											class="flex-1 flex flex-col justify-between gap-2"
										>
											<input type="hidden" name="opportunity_id" value={opp.id} />
											<input type="hidden" name="branch_id" value={branch.id} />

											<div>
												<div class="note-header-row">
													<button
														type="submit"
														class="note-icon-circle hover:border-amber-600 transition"
														title="Bấm để chọn nhánh này"
													></button>
													<button
														type="submit"
														class="note-title-text text-left hover:text-amber-700 transition"
													>
														{branch.name}
													</button>
												</div>

												{#if branch.outcome}
													<div class="note-subtitle-text">"{branch.outcome}"</div>
												{/if}
											</div>

											<div class="note-dashed-divider"></div>

											<div class="note-footer-row">
												<span class="pill-resource font-mono">{branch.cost_time}p • {formatMoneyVi(branch.cost_money)}</span>
												<div class="flex items-center gap-2">
													<button type="submit" class="text-action-link hover:text-amber-700 font-semibold cursor-pointer">
														Chọn &gt;
													</button>
													<button
														type="button"
														onclick={(e) => {
															e.stopPropagation();
															const delForm = document.getElementById(`del-branch-${branch.id}`) as HTMLFormElement;
															if (delForm && confirm(`Xóa nhánh "${branch.name}"?`)) {
																delForm.requestSubmit();
															}
														}}
														class="text-stone-300 hover:text-rose-500 text-xs ml-1"
														title="Xóa nhánh"
													>
														✕
													</button>
												</div>
											</div>
										</form>

										<form id="del-branch-{branch.id}" method="POST" action="?/deleteBranch" use:enhance class="hidden">
											<input type="hidden" name="id" value={branch.id} />
										</form>
									</div>
								{/if}
							{/each}
						</div>

						<!-- Add Branch Form Inline -->
						<div class="w-full max-w-xl mt-3">
							<form
								method="POST"
								action="?/addBranch"
								use:enhance={() => {
									return async ({ update }) => {
										await update();
										scheduleWireUpdate();
									};
								}}
								class="bg-white/80 border border-stone-200 rounded-xl p-2.5 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs shadow-xs"
							>
								<input type="hidden" name="opportunity_id" value={opp.id} />

								<div class="sm:col-span-5">
									<input
										type="text"
										name="name"
										required
										placeholder="Tên nhánh mới (vd: Đi bộ, Học bài...)"
										class="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-amber-600"
									/>
								</div>

								<div class="sm:col-span-2">
									<input
										type="number"
										name="cost_time"
										min="0"
										step="5"
										defaultValue={opp.time_minutes}
										placeholder="Phút"
										title="Phút tiêu hao"
										class="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs text-stone-900 focus:outline-none focus:bg-white focus:border-amber-600 font-mono"
									/>
								</div>

								<div class="sm:col-span-2">
									<input
										type="number"
										name="cost_money"
										min="0"
										step="1000"
										defaultValue={0}
										placeholder="VNĐ"
										title="Tiền tiêu hao"
										class="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs text-stone-900 focus:outline-none focus:bg-white focus:border-amber-600 font-mono"
									/>
								</div>

								<div class="sm:col-span-3 flex items-center gap-1.5">
									<input
										type="text"
										name="outcome"
										placeholder="Cảm xúc/Kết quả"
										class="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-amber-600"
									/>
									<button
										type="submit"
										class="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs whitespace-nowrap transition cursor-pointer"
									>
										+ Thêm
									</button>
								</div>
							</form>
						</div>

						<!-- BOTTOM WIRE down to Next Opp (if not the last one) -->
						{#if idx < opportunities.length - 1}
							{#if chosenBranch}
								<svg class="wire-box" id="wire-bottom-{opp.id}">
									<circle id="dot-bottom-start-{opp.id}" class="wire-dot" cx="0" cy="2" r="4.5" />
									<path id="path-wire-bottom-{opp.id}" class="wire-line" d="M 0 0 L 0 44" />
									<circle id="dot-bottom-end-{opp.id}" class="wire-dot" cx="0" cy="42" r="4.5" />
								</svg>
							{:else}
								<div class="straight-stem-line my-3"></div>
							{/if}
						{/if}
					{/if}

					<!-- Spacer between blocks when collapsed -->
					{#if isCollapsed && idx < opportunities.length - 1}
						<div class="straight-stem-line my-3"></div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
