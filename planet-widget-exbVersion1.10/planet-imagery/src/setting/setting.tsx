import { React, jsx, Immutable } from 'jimu-core';
import { AllWidgetSettingProps } from 'jimu-for-builder';
import { SettingSection, SettingRow, MapWidgetSelector } from 'jimu-ui/advanced/setting-components';
import { TextInput } from 'jimu-ui';
import { ImmutableObject } from 'jimu-core';
import {sentinelHubConfiguration} from '../config'

interface State {
  configuration_id: string;
  collection_id: string;
  client_id: string;
  client_secret: string;
}

interface Config {
  configuration_id: string;
  collection_id: string;
  credentials: {
    client_id: string;
    client_secret: string;
  };
  sentinelHubConfiguration: sentinelHubConfiguration
}

type IMConfig = ImmutableObject<Config>;


export default class Setting extends React.PureComponent<AllWidgetSettingProps<IMConfig>, State> {
  constructor(props: AllWidgetSettingProps<IMConfig>) {
    super(props);
    const { configuration_id, collection_id, credentials, sentinelHubConfiguration } = this.props.config || {};
    this.state = {
      configuration_id: sentinelHubConfiguration?.configuration_id || '',
      collection_id: sentinelHubConfiguration?.collection_id || '',
      client_id: credentials?.client_id || '',
      client_secret: credentials?.client_secret || '',
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.config !== this.props.config) {
      this.setState({
        configuration_id: this.props.config?.sentinelHubConfiguration?.configuration_id || '',
        collection_id: this.props.config?.sentinelHubConfiguration?.collection_id || '',
        client_id: this.props.config?.credentials?.client_id || '',
        client_secret: this.props.config?.credentials?.client_secret || ''
      });
    }
  }

  handleInputChange = (key: keyof State, value: string) => {
    this.setState(prevState => ({
      ...prevState,
      [key]: value
    } as Pick<State, keyof State>));
  };

  handleInputBlur = (key: keyof State) => {
    const value = this.state[key];
    const newConfig = this.props.config.setIn(['sentinelHubConfiguration', key], value);
    this.props.onSettingChange({
      id: this.props.id,
      config: newConfig
    });
  };

  handleInputBlurCredentials = (key: keyof State) => {
    const value = this.state[key];
    const newConfig = this.props.config.setIn(['credentials', key], value);
    this.props.onSettingChange({
      id: this.props.id,
      config: newConfig
    });
  };

  render() {
    return (
      <div>
        <SettingSection>
          <p>Select a Map</p>
          <SettingRow>
            <MapWidgetSelector
              onSelect={(useMapWidgetIds: string[]) => {
                this.props.onSettingChange({
                  id: this.props.id,
                  useMapWidgetIds
                });
              }}
              useMapWidgetIds={this.props.useMapWidgetIds}
            />
          </SettingRow>
          <SettingRow label='Configuration ID' />
          <SettingRow>
            <TextInput
              className="w-100"
              value={this.state.configuration_id}
              onChange={event => this.handleInputChange('configuration_id', event.target.value)}
              onBlur={() => { this.handleInputBlur('configuration_id') }}
              aria-label="Configuration ID"
            />
          </SettingRow>
          <SettingRow label='Collection ID' />
          <SettingRow>
            <TextInput
              className="w-100"
              value={this.state.collection_id}
              onChange={event => this.handleInputChange('collection_id', event.target.value)}
              onBlur={() => { this.handleInputBlur('collection_id') }}
              aria-label="Collection ID"
            />
          </SettingRow>
          <SettingRow label='Client ID' />
          <SettingRow>
            <TextInput
              className="w-100"
              value={this.state.client_id}
              onChange={event => this.handleInputChange('client_id', event.target.value)}
              onBlur={() => { this.handleInputBlurCredentials('client_id') }}
              aria-label="Client ID"
            />
          </SettingRow>
          <SettingRow label='Client Secret' />
          <SettingRow>
            <TextInput
              className="w-100"
              value={this.state.client_secret}
              onChange={event => this.handleInputChange('client_secret', event.target.value)}
              onBlur={() => { this.handleInputBlurCredentials('client_secret') }}
              aria-label="Client Secret"
            />
          </SettingRow>
        </SettingSection>
      </div>
    );
  }
}
