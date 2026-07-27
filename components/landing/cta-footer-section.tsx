import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { BrandLogo } from "../brand-logo"

export function CtaFooterSection() {
  return (
    <section className="px-4 sm:px-8 pb-12 sm:pb-16 max-w-6xl mx-auto">
      {/* Big CTA */}
      <div className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border border-white/60 bg-card/70 backdrop-blur-md p-8 sm:p-14 lg:p-20 text-center shadow-[0_30px_80px_-32px_oklch(0.4_0.08_330/0.45)]">
        <div
          aria-hidden
          className="absolute inset-0 -z-0"
          style={{
            background:
              "radial-gradient(50% 70% at 20% 30%, oklch(0.85 0.14 25 / 0.45), transparent), radial-gradient(50% 70% at 80% 70%, oklch(0.8 0.16 310 / 0.4), transparent)",
          }}
        />
        <div className="relative">
          <h2 className="text-[34px] sm:text-[52px] lg:text-[64px] leading-[1.02] font-semibold tracking-tight text-balance max-w-3xl mx-auto">
            Your next great conversation is one tap away.
          </h2>
          <p className="mt-5 text-[15.5px] sm:text-[18px] text-muted-foreground max-w-xl mx-auto leading-relaxed text-pretty">
            Free to try. No credit card. Your first session is the easiest one
            you&apos;ll ever have.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/setup"
              className="group inline-flex items-center justify-center gap-2 h-13 sm:h-14 px-7 rounded-full bg-foreground text-background font-medium tracking-tight shadow-[0_14px_30px_-12px_oklch(0.2_0.02_60/0.5)] active:scale-[0.99] transition w-full sm:w-auto py-3.5"
            >
              Start a session
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center justify-center h-13 sm:h-14 px-6 rounded-full bg-card/80 backdrop-blur-md border border-white/60 text-foreground/80 font-medium tracking-tight hover:bg-card transition w-full sm:w-auto py-3.5"
            >
              Explore capabilities
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 pt-10 border-t border-foreground/8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2">
        <BrandLogo size={36} />
          <span className="text-[15px] font-semibold tracking-tight">CogniFlip</span>
          <span className="ml-2 text-[12.5px] text-muted-foreground">
            © {new Date().getFullYear()}
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13.5px] text-muted-foreground">
          <Link href="#features" className="hover:text-foreground transition">
            Features
          </Link>
          <Link href="#how-it-works" className="hover:text-foreground transition">
            How it works
          </Link>
          <Link href="#personas" className="hover:text-foreground transition">
            Personas
          </Link>
          <Link href="/setup" className="hover:text-foreground transition">
            Get started
          </Link>
        </nav>
      </footer>
    </section>
  )
}
