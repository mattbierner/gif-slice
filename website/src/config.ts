export const debug = location.host === 'localhost:3000' || location.host === 'imac.local:3000';

if (debug) {
    console.log('In debug mode')
}

export const calculateShippingAndTaxEndpoint = debug
    ? 'http://localhost:7071/api/CalculateShippingAndTax'
    : 'https://gifsliceapi.azurewebsites.net/api/CalculateShippingAndTax?code=Hy9DMdyQ3FGfN9lEc2Q2PzEAPcOaJpHOsGtqcBaDstmMEHB2bewFig=='


export const orderEndpoint = debug
    ? 'http://localhost:7071/api/Order/'
    : 'https://gifsliceapi.azurewebsites.net/api/Order?code=nCpHveKAgA9XlQDrRo1MxLTDIV2mSTW8KbmpsP2yPWEyIFVZAaeRTg=='


export const stipePublicKey = debug
    ? 'pk_test_FcRt3eRXvMsIzJjBHWPZxu0z'
    : 'pk_live_2323Duu0u9IAIeMLlQO8hSU7';