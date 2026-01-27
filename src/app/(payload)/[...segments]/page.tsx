/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { Metadata } from 'next'

import configPromise from '@payload-config'
import React from 'react'

type Args = {
  params: {
    segments: string[]
  }
  searchParams: {
    [key: string]: string | string[]
  }
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config: configPromise, params, searchParams })

const Page = ({ params, searchParams }: Args) =>
  RootPage({ config: configPromise, params, searchParams })

export default Page
