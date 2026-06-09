import { Hero } from './components/Hero'
import { Portfolio } from './components/Portfolio'
import { Awards } from './components/Awards'
import { About } from './components/About'
import { Services } from './components/Services'
import { Team } from './components/Team'
import { Contact } from './components/Contact'
import { Footer } from './components/Footer'
import { Reveal } from './components/animations/Reveal'

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground" style={{ overflow: 'visible' }}>
      <main className="relative" role="main" style={{ overflow: 'visible' }}>
        <section id="hero" aria-label="Hero section">
          <Hero />
        </section>
        <section id="portfolio" aria-label="Portfolio section">
          <Reveal direction="blur"><Portfolio /></Reveal>
        </section>
        <section id="awards" aria-label="Awards section">
          <Reveal direction="up" delay={0.05}><Awards /></Reveal>
        </section>
        <section id="about" aria-label="About section">
          <Reveal direction="blur"><About /></Reveal>
        </section>
        <section id="services" aria-label="Services section">
          <Reveal direction="up"><Services /></Reveal>
        </section>
        <section id="team" aria-label="Team section" style={{ overflow: 'visible', height: 'auto', minHeight: '0', maxHeight: 'none' }}>
          <Reveal direction="scale"><Team /></Reveal>
        </section>
        <section id="contact" aria-label="Contact section">
          <Reveal direction="blur"><Contact /></Reveal>
        </section>
      </main>
      <Footer />
    </div>
  )
}
