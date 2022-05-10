import Link from 'next/link'
import Layout from '../components/Layout'
function calculateDaysBetweenDates({ begin, end }: { begin; end }) {}
const AboutPage = () => (
  <Layout title="Dashboard | TaxMe">
    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
      <h1 className="my-4">TaxMe protocol disclaimer</h1>

      <p className="my-4">
        TaxMe is a decentralized peer-to-peer protocol that people can use to
        hold sales taxes. Your use of the TaxMe protocol involves various risks,
        including, but not limited to, losses while digital assets are being
        supplied to the TaxMe protocol and losses due to the fluctuation of
        prices of tokens. Before using the TaxMe protocol, you should review the
        relevant documentation to make sure you understand how the TaxMe
        protocol works. Additionally, just as you can access email email
        protocols such as SMTP through multiple email clients, you can access
        the TaxMe protocol through dozens of web or mobile interfaces. You are
        responsible for doing your own diligence on those interfaces to
        understand the fees and risks they present.
      </p>
      <p>
        AS DESCRIBED IN THE TaxMe PROTOCOL LICENSES, THE TaxMe PROTOCOL IS
        PROVIDED "AS IS", AT YOUR OWN RISK, AND WITHOUT WARRANTIES OF ANY KIND.
        No developer or entity involved in creating the TaxMe protocol will be
        liable for any claims or damages whatsoever associated with your use,
        inability to use, or your interaction with other users of, the TaxMe
        protocol, including any direct, indirect, incidental, special,
        exemplary, punitive or consequential damages, or loss of profits,
        cryptocurrencies, tokens, or anything else of value.
      </p>
    </div>
  </Layout>
)

export default AboutPage
