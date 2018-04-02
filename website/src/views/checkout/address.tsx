import { Address, states } from 'gif-slice-shared';
import { Select, TextField, InputLabel, FormControl } from 'material-ui';
import * as React from 'react';

class LabeledInput extends React.Component<{ id: string, label: string, optional?: boolean, value: string, onChange: (x: string) => void, autoComplete?: string, type?: string }> {
    render() {
        return (
            <div className='labeled-input'>
                <TextField
                    required={!this.props.optional}
                    fullWidth
                    id={this.props.id}
                    type={this.props.type || 'text'}
                    label={this.props.label}
                    value={this.props.value}
                    autoComplete={this.props.autoComplete}
                    onChange={e => this.props.onChange((e.target as HTMLInputElement).value)}
                    InputLabelProps={{
                        shrink: true,
                    }} />
            </div>
        )
    }
}

interface ShippingFormProps {
    address: Address

    onChange: (newAddress: Address) => void
}

export class ShippingForm extends React.Component<ShippingFormProps> {
    render() {
        return (
            <div className='address-form'>
                <LabeledInput id='full-name'
                    label='Full Name'
                    autoComplete='name'
                    value={this.props.address.name}
                    onChange={newName => this.updateAddress(this.props.address.withName(newName))} />

                <LabeledInput id='address-1'
                    label='Address Line 1'
                    autoComplete='address-line1'
                    value={this.props.address.line1}
                    onChange={newLine1 => this.updateAddress(this.props.address.withLine1(newLine1))} />

                <LabeledInput id='address-2'
                    label='Address Line 2 (optional)'
                    autoComplete='address-line2'
                    optional={true}
                    value={this.props.address.line2 || ''}
                    onChange={newLine2 => this.updateAddress(this.props.address.withLine2(newLine2))} />

                <LabeledInput id='city'
                    label='City'
                    autoComplete='address-level2'
                    value={this.props.address.city}
                    onChange={newCity => this.updateAddress(this.props.address.withCity(newCity))} />

                <FormControl fullWidth>
                    <InputLabel htmlFor='state'>State</InputLabel>
                    <Select id='state'
                        autoComplete='address-state'
                        name='state'
                        fullWidth
                        native={true}
                        value={this.props.address.stateCode}
                        onChange={newStateCode => this.updateAddress(this.props.address.withStateCode(newStateCode.target.value))}>
                        {[['', '']].concat(Array.from(states.entries())).map(pair =>
                            <option key={pair[1]} value={pair[1]}>{pair[0]}</option>
                        )}

                    </Select>
                </FormControl>

                <LabeledInput id='zip'
                    label='Postal / Zip Code'
                    autoComplete='postal-code'
                    value={this.props.address.zip}
                    onChange={newZip => this.updateAddress(this.props.address.withZip(newZip))} />
            </div>
        )
    }

    private updateAddress(newAddress: Address) {
        this.props.onChange(newAddress)
    }
}