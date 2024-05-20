import { type ImmutableObject, type Expression, type ThemeButtonType, type IconProps, type IconResult } from 'jimu-core'
import { type LinkParam } from 'jimu-ui/advanced/setting-components'

export type IMConfig = ImmutableObject<Config>

export interface Config {
  credentialsConfig: credentialsConfig
}

export interface credentialsConfig {
  client_id?: string
  client_secret?: string
}

export interface sentinelHubConfiguration {
    configuration_id?: string
    collection_id?: string
}