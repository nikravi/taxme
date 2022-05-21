import Link from 'next/link'
import Layout from '../components/Layout'
function calculateDaysBetweenDates({ begin, end }: { begin; end }) {
  
}
const AboutPage = () => (
  <Layout title="About | web3fy">
    <div className="bg-gray-100">
      <h1>About</h1>
      <p>This is the about page</p>
      <p>
        <Link href="/">
          <a>Go home</a>
        </Link>
      </p>
    </div>
  </Layout>
);

export default AboutPage
