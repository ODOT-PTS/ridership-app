import {
  queryAgencies,
} from '../lib/api.js'

import config from '../config.json'

import Container from '../components/container'
import Footer from '../components/footer'

export default function Home() {
  const firstDatabase = config.databases[0].sqlitePath
  const agencies = queryAgencies(firstDatabase)

  return (
    <div>
      <main className="container mx-auto justify-center mb-5">
        <Container agencies={agencies} />
      </main>
      <Footer />
    </div>
  )
}
