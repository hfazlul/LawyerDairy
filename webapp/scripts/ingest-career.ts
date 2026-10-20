import { ingestBarCouncilContent } from '../src/lib/master/career-ingest'
import { ingestHighCourtContent } from '../src/lib/master/hc-ingest'
import { ingestBjsContent } from '../src/lib/master/bjs-ingest'
import { uniqueHcDataset } from '../src/lib/master/pack-paths'

async function main() {
  console.log('Career ingest (unique files only; no fake MCQ)')
  try {
    const hcMeta = uniqueHcDataset()
    console.log('HC unique dataset', {
      path: hcMeta.path,
      sha256: hcMeta.sha256,
      copiesOnDisk: hcMeta.copies,
      uniqueHashes: hcMeta.uniqueHashes,
    })
  } catch (err) {
    console.warn('HC path resolve failed', err)
  }

  try {
    const bar = await ingestBarCouncilContent()
    console.log('Bar Council ingested', bar)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Bar ingest failed (Postgres down or schema not pushed?):', msg.split('\n')[0])
    process.exitCode = 1
  }

  try {
    const hc = await ingestHighCourtContent()
    console.log('High Court ingested', hc)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('HC ingest failed (Postgres down or schema not pushed?):', msg.split('\n')[0])
    process.exitCode = 1
  }

  try {
    const bjs = await ingestBjsContent()
    console.log('BJS ingested', bjs)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('BJS ingest failed (Postgres down or schema not pushed?):', msg.split('\n')[0])
    process.exitCode = 1
  }
}

main()
