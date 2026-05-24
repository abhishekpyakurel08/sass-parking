<template>
  <div>
    <NavBar />
    <main class="min-h-screen bg-slate-50 font-sans">
      <section class="max-w-screen-2xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div class="landing-panel reveal-on-scroll max-w-6xl">
          <div class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
            Smart parking platform
          </div>
          <h1 class="mt-6 text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[0.96] uppercase">
            Fast & Smart<br />Parking<br />Management
          </h1>
          <p class="mt-6 text-lg text-slate-600 leading-9 max-w-4xl">
            A complete POS system for parking operators. Issue QR-coded tickets, calculate fees by vehicle type, manage regular customers, and print thermal receipts instantly.
          </p>


          <div class="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3">
            <RouterLink to="/login" class="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-slate-900 px-8 py-4 text-base font-bold text-white border border-slate-900 hover:bg-slate-800 transition-colors">Open Go TO Dashboard</RouterLink>
            <a href="#about" class="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-white px-8 py-4 text-base font-bold text-slate-900 border border-slate-300 hover:bg-slate-100 transition-colors">View Features</a>
            <a href="#pricing" class="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-slate-200 px-8 py-4 text-base font-bold text-slate-900 border border-slate-300 hover:bg-slate-300 transition-colors">Take a Tour</a>
          </div>

          <div class="mt-10 border-t border-slate-200 pt-8">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="stats-inline reveal-on-scroll rounded-2xl border border-slate-200 bg-white px-4 py-5 text-center shadow-sm">
                <div class="text-4xl font-black text-slate-900">15 min</div>
                <div class="mt-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Grace Period</div>
              </div>
              <div class="stats-inline reveal-on-scroll rounded-2xl border border-slate-200 bg-white px-4 py-5 text-center shadow-sm">
                <div class="text-4xl font-black text-slate-900">NPR</div>
                <div class="mt-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Local Billing</div>
              </div>
              <div class="stats-inline reveal-on-scroll rounded-2xl border border-slate-200 bg-white px-4 py-5 text-center shadow-sm">
                <div class="text-4xl font-black text-slate-900">QR</div>
                <div class="mt-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Fast Entry / Exit</div>
              </div>
              <div class="stats-inline reveal-on-scroll rounded-2xl border border-slate-200 bg-white px-4 py-5 text-center shadow-sm">
                <div class="text-4xl font-black text-slate-900">24/7</div>
                <div class="mt-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Operations Ready</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" class="reveal-on-scroll max-w-screen-2xl mx-auto px-4 sm:px-6 py-10 lg:py-14">
        <div class="text-center">
          <h2 class="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">HOW IT WORKS</h2>
          <p class="mt-4 max-w-5xl mx-auto text-lg text-slate-600 leading-8">
            The app keeps the parking flow simple: issue a QR ticket at entry, track the session while the vehicle is parked, calculate the fee at exit, and review the results in the dashboard.
          </p>
        </div>

        <div class="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div class="about-card reveal-on-scroll rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
            <div class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Step 1</div>
            <h3 class="mt-4 text-2xl font-extrabold text-slate-900">Entry Ticket</h3>
            <p class="mt-3 text-slate-600 leading-7">Staff creates a QR ticket when the vehicle enters the lot, so the session starts cleanly and can be traced later.</p>
          </div>
          <div class="about-card reveal-on-scroll rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
            <div class="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Step 2</div>
            <h3 class="mt-4 text-2xl font-extrabold text-slate-900">Parking Tracking</h3>
            <p class="mt-3 text-slate-600 leading-7">The app monitors the parked vehicle, current occupancy, and active ticket details while the car stays inside.</p>
          </div>
          <div class="about-card reveal-on-scroll rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
            <div class="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">Step 3</div>
            <h3 class="mt-4 text-2xl font-extrabold text-slate-900">Auto Billing</h3>
            <p class="mt-3 text-slate-600 leading-7">At exit, the system calculates the total fee using vehicle type, time parked, grace period, and pricing rules.</p>
          </div>
          <div class="about-card reveal-on-scroll rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
            <div class="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Step 4</div>
            <h3 class="mt-4 text-2xl font-extrabold text-slate-900">Reports</h3>
            <p class="mt-3 text-slate-600 leading-7">Operators review revenue, occupancy, and ticket history from the dashboard to keep the business under control.</p>
          </div>
        </div>
      </section>

      <section id="about" class="reveal-on-scroll max-w-screen-2xl mx-auto px-4 sm:px-6 py-10 lg:py-14">
        <div class="text-center">
          <h2 class="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">ABOUT PARKSAAS PRO</h2>
          <p class="mt-4 max-w-5xl mx-auto text-lg text-slate-600 leading-8">
            We are a parking technology platform focused on modernizing entry, tracking, ticketing and billing. Built for local parking operations with scalable controls for multi-location growth.
          </p>
        </div>

        <div class="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="about-card reveal-on-scroll rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
            <div class="w-14 h-14 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center"><Car class="w-6 h-6" /></div>
            <h3 class="mt-6 text-3xl font-extrabold text-slate-900">Local Expertise</h3>
            <p class="mt-4 text-slate-600 leading-7">Built for real parking operations with regional compliance and day-to-day gate workflows in mind.</p>
          </div>
          <div class="about-card reveal-on-scroll rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
            <div class="w-14 h-14 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center"><MapPin class="w-6 h-6" /></div>
            <h3 class="mt-6 text-3xl font-extrabold text-slate-900">Nationwide Ready</h3>
            <p class="mt-4 text-slate-600 leading-7">Designed to scale from a single lot to multi-location operations across cities and municipalities.</p>
          </div>
          <div class="about-card reveal-on-scroll rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
            <div class="w-14 h-14 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center"><Users class="w-6 h-6" /></div>
            <h3 class="mt-6 text-3xl font-extrabold text-slate-900">Operator Focused</h3>
            <p class="mt-4 text-slate-600 leading-7">Created with direct operator feedback to keep check-in, check-out, and shift handover simple.</p>
          </div>
          <div class="about-card reveal-on-scroll rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
            <div class="w-14 h-14 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center"><ShieldCheck class="w-6 h-6" /></div>
            <h3 class="mt-6 text-3xl font-extrabold text-slate-900">Revenue Integrity</h3>
            <p class="mt-4 text-slate-600 leading-7">Reduce manual errors through automatic fare calculation, clear ticket trails, and auditable records.</p>
          </div>
        </div>
      </section>

      <section id="pricing" class="reveal-on-scroll max-w-screen-2xl mx-auto px-4 sm:px-6 py-8 lg:py-10">
        <div class="engine-panel reveal-on-scroll rounded-[2rem] bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300 p-7 sm:p-9 text-slate-900 shadow-xl">
          <div class="text-xs uppercase tracking-[0.18em] font-bold text-emerald-700">Powerful POS Engine</div>
          <h3 class="mt-3 text-3xl sm:text-4xl font-black tracking-tight">Automatic pricing rules for every vehicle type</h3>
          <p class="mt-4 text-slate-600 max-w-5xl leading-7">
            Configure rates by vehicle type, grace periods, and hourly additions. The engine computes the exact fare instantly during exit, reducing manual errors and revenue leakage.
          </p>

          <div class="mt-6 grid sm:grid-cols-3 gap-4">
            <div class="reveal-on-scroll rounded-2xl bg-white border border-slate-300 p-4">
              <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center"><Ticket class="w-5 h-5" /></div>
              <div class="mt-3 font-semibold">QR Ticket Generation</div>
              <p class="mt-2 text-sm text-slate-600 leading-6">Creates a scannable ticket at entry so staff can verify sessions and bill accurately at exit.</p>
            </div>
            <div class="reveal-on-scroll rounded-2xl bg-white border border-slate-300 p-4">
              <div class="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center"><Printer class="w-5 h-5" /></div>
              <div class="mt-3 font-semibold">Thermal Receipt Ready</div>
              <p class="mt-2 text-sm text-slate-600 leading-6">Formats payment details for thermal printers, giving drivers clear receipts in seconds.</p>
            </div>
            <div class="reveal-on-scroll rounded-2xl bg-white border border-slate-300 p-4">
              <div class="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center"><Cog class="w-5 h-5" /></div>
              <div class="mt-3 font-semibold">Dynamic Rate Rules</div>
              <p class="mt-2 text-sm text-slate-600 leading-6">Applies vehicle type, time slabs, and grace logic automatically to prevent manual pricing errors.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="reveal-on-scroll max-w-screen-2xl mx-auto px-4 sm:px-6 py-8 lg:py-10">
        <div class="text-center">
          <h2 class="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">FLEXIBLE PRICING RULES</h2>
          <p class="mt-4 text-lg text-slate-600">Transparent pricing templates inspired by real parking operations.</p>
        </div>

        <div class="plan-shell reveal-on-scroll pricing-surface mt-10 p-7 sm:p-10">
          <div class="grid lg:grid-cols-3 gap-5 xl:gap-6">
            <article class="plan-card reveal-on-scroll pricing-card rounded-[1.8rem] border border-slate-200 bg-white overflow-hidden">
              <div class="pricing-top px-7 py-10 text-center">
                <div class="text-xs font-bold uppercase tracking-[0.28em] text-slate-600">Motorbike</div>
                <div class="mt-6 text-6xl font-black text-slate-900 leading-none">Rs. 20</div>
                <div class="mt-1 text-lg font-semibold text-slate-500">/1st hr</div>
              </div>
              <div class="pricing-bottom px-7 py-8">
                <p class="text-slate-600 leading-8">Standard daily rate for two-wheelers with a 15-minute free grace period.</p>
                <ul class="mt-7 space-y-4 text-slate-800">
                  <li class="flex items-center gap-3"><span class="pricing-check"><Check class="w-4 h-4" /></span>15 min grace period</li>
                  <li class="flex items-center gap-3"><span class="pricing-check"><Check class="w-4 h-4" /></span>NPR 10 / extra hour</li>
                  <li class="flex items-center gap-3"><span class="pricing-check"><Check class="w-4 h-4" /></span>NPR 20 minimum</li>
                  <li class="flex items-center gap-3"><span class="pricing-check"><Check class="w-4 h-4" /></span>Night multiplier applicable</li>
                </ul>
              </div>
            </article>

            <article class="plan-card reveal-on-scroll pricing-card rounded-[1.8rem] border border-slate-200 bg-white overflow-hidden">
              <div class="pricing-top px-7 py-10 text-center">
                <div class="text-xs font-bold uppercase tracking-[0.28em] text-slate-600">Car / SUV</div>
                <div class="mt-6 text-6xl font-black text-slate-900 leading-none">Rs. 50</div>
                <div class="mt-1 text-lg font-semibold text-slate-500">/1st hr</div>
              </div>
              <div class="pricing-bottom px-7 py-8">
                <p class="text-slate-600 leading-8">Premium secure parking for light four-wheelers and family vehicles.</p>
                <ul class="mt-7 space-y-4 text-slate-800">
                  <li class="flex items-center gap-3"><span class="pricing-check"><Check class="w-4 h-4" /></span>15 min grace period</li>
                  <li class="flex items-center gap-3"><span class="pricing-check"><Check class="w-4 h-4" /></span>NPR 20 / extra hour</li>
                  <li class="flex items-center gap-3"><span class="pricing-check"><Check class="w-4 h-4" /></span>NPR 50 minimum</li>
                  <li class="flex items-center gap-3"><span class="pricing-check"><Check class="w-4 h-4" /></span>Dedicated spacious spots</li>
                </ul>
              </div>
            </article>

            <article class="plan-card reveal-on-scroll pricing-card rounded-[1.8rem] border border-slate-200 bg-white overflow-hidden">
              <div class="pricing-top px-7 py-10 text-center">
                <div class="text-xs font-bold uppercase tracking-[0.28em] text-slate-600">Bus / Truck</div>
                <div class="mt-6 text-6xl font-black text-slate-900 leading-none">Rs. 100</div>
                <div class="mt-1 text-lg font-semibold text-slate-500">/1st hr</div>
              </div>
              <div class="pricing-bottom px-7 py-8">
                <p class="text-slate-600 leading-8">Heavy vehicle parking with 24-hour security guarding and CCTV.</p>
                <ul class="mt-7 space-y-4 text-slate-800">
                  <li class="flex items-center gap-3"><span class="pricing-check"><Check class="w-4 h-4" /></span>Larger turning radius</li>
                  <li class="flex items-center gap-3"><span class="pricing-check"><Check class="w-4 h-4" /></span>NPR 40 / extra hour</li>
                  <li class="flex items-center gap-3"><span class="pricing-check"><Check class="w-4 h-4" /></span>Overnight limits apply</li>
                  <li class="flex items-center gap-3"><span class="pricing-check"><Check class="w-4 h-4" /></span>CCTV surveillance</li>
                </ul>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="reviews" class="reveal-on-scroll max-w-screen-2xl mx-auto px-4 sm:px-6 py-8 pb-16">
        <div class="text-center">
          <h2 class="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">OPERATOR FEEDBACK</h2>
          <p class="mt-4 text-lg text-slate-600">Trusted by parking lot operators. Real words from day-to-day users.</p>
        </div>

        <div class="mt-10 rounded-[2rem] bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div class="review-highlight reveal-on-scroll rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300 p-6 sm:p-8 text-slate-900">
            <div class="flex gap-1 text-amber-300"><Star class="w-5 h-5 fill-current" /><Star class="w-5 h-5 fill-current" /><Star class="w-5 h-5 fill-current" /><Star class="w-5 h-5 fill-current" /><Star class="w-5 h-5 fill-current" /></div>
            <p class="mt-4 text-lg leading-8 text-slate-700">
              "Before this POS system, calculating night fees and lost tickets was a nightmare. Now scanning the QR receipt instantly shows exact amount and rules apply automatically."
            </p>
            <div class="mt-6 flex items-center gap-3">
              <img src="https://i.pravatar.cc/96?u=kiran" alt="Kiran Maharjan" class="w-12 h-12 rounded-full object-cover border border-slate-300" />
              <div>
                <div class="font-semibold text-slate-900 leading-tight">Kiran Maharjan</div>
                <div class="text-sm text-slate-500 leading-tight mt-1">Lot Owner</div>
              </div>
            </div>
          </div>

          <div class="mt-6 grid md:grid-cols-3 gap-6">
          <div class="review-card reveal-on-scroll rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
            <div class="flex gap-1 text-amber-400"><Star class="w-4 h-4 fill-current" /><Star class="w-4 h-4 fill-current" /><Star class="w-4 h-4 fill-current" /><Star class="w-4 h-4 fill-current" /><Star class="w-4 h-4 fill-current" /></div>
            <p class="mt-4 text-slate-700 leading-7">"Gate operations became faster in week one. Ticket checks and exits are smooth, even in rush hours."</p>
            <div class="mt-6 flex items-center gap-3">
              <img src="https://i.pravatar.cc/96?u=rajesh" alt="Rajesh Shrestha" class="w-11 h-11 rounded-full object-cover border border-slate-200" />
              <div>
                <div class="text-sm font-semibold text-slate-900 leading-tight">Rajesh Shrestha</div>
                <div class="text-xs text-slate-500 leading-tight mt-1">Parking Attendant</div>
              </div>
            </div>
          </div>

          <div class="review-card reveal-on-scroll rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
            <div class="flex gap-1 text-amber-400"><Star class="w-4 h-4 fill-current" /><Star class="w-4 h-4 fill-current" /><Star class="w-4 h-4 fill-current" /><Star class="w-4 h-4 fill-current" /><Star class="w-4 h-4 fill-current" /></div>
            <p class="mt-4 text-slate-700 leading-7">"The revenue view gave us visibility we never had before. We spotted leaks and improved collections quickly."</p>
            <div class="mt-6 flex items-center gap-3">
              <img src="https://i.pravatar.cc/96?u=sunita" alt="Sunita Tamang" class="w-11 h-11 rounded-full object-cover border border-slate-200" />
              <div>
                <div class="text-sm font-semibold text-slate-900 leading-tight">Sunita Tamang</div>
                <div class="text-xs text-slate-500 leading-tight mt-1">Operations Manager</div>
              </div>
            </div>
          </div>

          <div class="review-card reveal-on-scroll rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
            <div class="flex gap-1 text-amber-400"><Star class="w-4 h-4 fill-current" /><Star class="w-4 h-4 fill-current" /><Star class="w-4 h-4 fill-current" /><Star class="w-4 h-4 fill-current" /><Star class="w-4 h-4 fill-current" /></div>
            <p class="mt-4 text-slate-700 leading-7">"Clean UI, low training time, and reliable performance. Staff was comfortable with the system quickly."</p>
            <div class="mt-6 flex items-center gap-3">
              <img src="https://i.pravatar.cc/96?u=bikash" alt="Bikash Thapa" class="w-11 h-11 rounded-full object-cover border border-slate-200" />
              <div>
                <div class="text-sm font-semibold text-slate-900 leading-tight">Bikash Thapa</div>
                <div class="text-xs text-slate-500 leading-tight mt-1">Security Guard</div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue"
import { Car, MapPin, Users, ShieldCheck, Star, Ticket, Printer, Cog, BarChart3, Check } from "lucide-vue-next"
import NavBar from '../../components/NavBar.vue'
import AppFooter from '../../components/AppFooter.vue'

let revealObserver: IntersectionObserver | null = null

onMounted(() => {
  const revealElements = document.querySelectorAll<HTMLElement>(".reveal-on-scroll")

  if (!revealElements.length) {
    return
  }

  const currentObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible")
          currentObserver.unobserve(entry.target)
        }
      })
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -10% 0px",
    },
  )

  revealObserver = currentObserver
  revealElements.forEach((element) => currentObserver.observe(element))
})

onBeforeUnmount(() => {
  revealObserver?.disconnect()
  revealObserver = null
})
</script>

<style scoped>
.reveal-on-scroll {
  opacity: 0;
  transform: translateY(32px);
  transition: opacity 700ms ease, transform 700ms ease;
  will-change: opacity, transform;
  animation: none !important;
}

.reveal-on-scroll.is-visible {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .reveal-on-scroll {
    opacity: 1;
    transform: none;
    transition: none;
  }
}

.landing-panel {
  animation: fade-up 700ms ease-out both;
}

.landing-panel-dark {
  animation-delay: 90ms;
}

.landing-feature-card,
.workflow-card,
.feature-card,
.stats-card,
.about-card,
.plan-card,
.review-card,
.plan-shell,
.plan-mini-card,
.engine-panel,
.review-highlight {
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background-color 180ms ease;
}

.landing-feature-card:hover,
.workflow-card:hover,
.feature-card:hover,
.stats-card:hover,
.about-card:hover,
.plan-card:hover,
.review-card:hover,
.plan-shell:hover,
.plan-mini-card:hover,
.engine-panel:hover,
.review-highlight:hover {
  transform: translateY(-2px);
}

.stats-card {
  animation: card-rise 560ms ease-out both;
}

.stats-inline {
  animation: card-rise 560ms ease-out both;
}

.stats-inline:nth-child(1) { animation-delay: 80ms; }
.stats-inline:nth-child(2) { animation-delay: 140ms; }
.stats-inline:nth-child(3) { animation-delay: 200ms; }
.stats-inline:nth-child(4) { animation-delay: 260ms; }

.stats-card:nth-child(1) { animation-delay: 80ms; }
.stats-card:nth-child(2) { animation-delay: 140ms; }
.stats-card:nth-child(3) { animation-delay: 200ms; }
.stats-card:nth-child(4) { animation-delay: 260ms; }

.about-card,
.plan-card,
.review-card {
  animation: card-rise 620ms ease-out both;
}

.about-card:nth-child(1) { animation-delay: 100ms; }
.about-card:nth-child(2) { animation-delay: 170ms; }
.about-card:nth-child(3) { animation-delay: 240ms; }
.about-card:nth-child(4) { animation-delay: 310ms; }

.plan-card:nth-child(1) { animation-delay: 110ms; }
.plan-card:nth-child(2) { animation-delay: 180ms; }
.plan-card:nth-child(3) { animation-delay: 250ms; }

.review-card:nth-child(1) { animation-delay: 120ms; }
.review-card:nth-child(2) { animation-delay: 190ms; }
.review-card:nth-child(3) { animation-delay: 260ms; }

.stats-card:hover,
.about-card:hover,
.plan-card:hover,
.review-card:hover {
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.plan-shell {
  animation: fade-up 680ms ease-out both;
  animation-delay: 120ms;
}

.pricing-surface {
  background: transparent;
  border: none;
}

.pricing-card {
  min-height: 640px;
  transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
}

.pricing-card:hover {
  border-color: #64748b;
  box-shadow: 0 14px 26px rgba(100, 116, 139, 0.20);
}

.pricing-top {
  min-height: 210px;
}

.pricing-bottom {
  border-top: 1px solid #e2e8f0;
  min-height: 430px;
}

.pricing-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: #e5e7eb;
  color: #1f2937;
  flex-shrink: 0;
}

.engine-panel,
.review-highlight {
  animation: fade-up 680ms ease-out both;
}

.engine-panel { animation-delay: 110ms; }
.review-highlight { animation-delay: 120ms; }

.plan-mini-card:hover {
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.08);
}

.feature-card {
  animation: card-rise 650ms ease-out both;
}

.feature-card:nth-child(1) {
  animation-delay: 110ms;
}

.feature-card:nth-child(2) {
  animation-delay: 190ms;
}

.feature-card:nth-child(3) {
  animation-delay: 270ms;
}

.feature-card:nth-child(4) {
  animation-delay: 350ms;
}

.landing-feature-card:hover {
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
}

.workflow-card:hover {
  box-shadow: 0 16px 28px rgba(16, 185, 129, 0.10);
  border-color: rgba(16, 185, 129, 0.35);
}

.animate-float-gentle {
  animation: float-gentle 5.5s ease-in-out infinite;
}

.animate-hero-glow {
  animation: hero-glow 8s ease-in-out infinite;
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes card-rise {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.99);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes float-gentle {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@keyframes hero-glow {
  0%,
  100% {
    opacity: 0.75;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.02);
  }
}
</style>
