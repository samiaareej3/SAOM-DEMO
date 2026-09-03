import Navbar from '../components/Navbar.jsx'
import Hero from '../components/Hero.jsx'
import ProblemSection from '../components/ProblemSection.jsx'
import DifferenceSection from '../components/DifferenceSection.jsx'
import PinnedStory from '../components/PinnedStory.jsx'
import GlobalThreatSection from '../components/GlobalThreatSection.jsx'
import AutonomousSOC from '../components/AutonomousSOC.jsx'
import CTASection from '../components/CTASection.jsx'
import Footer from '../components/Footer.jsx'

export default function Home() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />

        <ProblemSection />

        <DifferenceSection />

        <PinnedStory />

        <GlobalThreatSection />

        <AutonomousSOC />

        <CTASection />
      </main>

      <Footer />
    </>
  )
}