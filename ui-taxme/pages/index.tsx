import Link from 'next/link'
import Layout from '../components/Layout'
import QuickSignUp from '../components/QuickSignUp'

const IndexPage = () => {

  return <Layout title="The smart way to collect and pay your sales taxes | TaxMe" showLoginInNavbar={false}>

    <div className="bg-gray-800 ">

      <div className=" pt-6 pb-16 sm:pb-24">

        <main className="mt-16 sm:mt-24">
          <div className="mx-auto max-w-7xl">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              <div className="px-4 sm:px-6 sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left lg:flex lg:items-center">
                <div>
                  
                  <h1 className="mt-4 text-4xl tracking-tight font-extrabold text-white sm:mt-5 sm:leading-none lg:mt-6 lg:text-5xl xl:text-6xl">
                    <span className="md:block">Collect sales taxes</span>{' '}
                    <span className="text-indigo-400 md:block">pay them on schedule and earn in-between</span>
                  </h1>
                  <p className="mt-3 text-base text-gray-300 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                    TaxMe is a simple tool that helps you collect and pay your sales taxes using smart contracts and chainlink
                  </p>
                  
                </div>
              </div>
              <div className="mt-16 sm:mt-24 lg:mt-0 lg:col-span-6">
                <QuickSignUp />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  </Layout>
}

export default IndexPage
