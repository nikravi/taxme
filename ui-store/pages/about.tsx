import Link from 'next/link'
import Layout from '../components/Layout'
function calculateDaysBetweenDates({ begin, end }: { begin; end }) {
  
}
const AboutPage = () => (
  <Layout title="About | Splitify">
    <h1>About</h1>
    <p>This is the about page</p>
    <p>
      <Link href="/">
        <a>Go home</a>
      </Link>
    </p>
  </Layout>
)

export default AboutPage
