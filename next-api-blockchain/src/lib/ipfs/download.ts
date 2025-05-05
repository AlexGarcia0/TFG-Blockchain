import { create } from 'ipfs-http-client'

const ipfs = create({ url: 'http://localhost:5001' })

export async function downloadFromIPFS(cid: string) {
  const stream = ipfs.cat(cid)
  const chunks = []
  for await (const chunk of stream) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}
