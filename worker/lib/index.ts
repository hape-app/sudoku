import {importSPKI, jwtVerify} from 'jose'

export * as db from './db'

export async function jwtParse<T>(raw: string, pem: string): Promise<T> {
  const puk = await importSPKI(pem, 'RS256')
  const {payload} = await jwtVerify(raw, puk)
  return payload as T
}
