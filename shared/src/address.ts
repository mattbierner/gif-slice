
export class Address {
    public static readonly empty = new Address('', '', '', '', '', '')

    public static fromJson(blob: any) {
        return new Address(
            blob.name || '',
            blob.line1 || '',
            blob.line2 || '',
            blob.city || '',
            blob.stateCode || '',
            blob.zip || ''
        )
    }

    private constructor(
        public readonly name: string,
        public readonly line1: string,
        public readonly line2: string,
        public readonly city: string,
        public readonly stateCode: string,
        public readonly zip: string
    ) { }

    public withName(newName: string) {
        return new Address(newName, this.line1, this.line2, this.city, this.stateCode, this.zip);
    }

    public withLine1(newLine1: string) {
        return new Address(this.name, newLine1, this.line2, this.city, this.stateCode, this.zip);
    }

    public withLine2(newLine2: string) {
        return new Address(this.name, this.line1, newLine2, this.city, this.stateCode, this.zip);
    }

    public withCity(newCity: string) {
        return new Address(this.name, this.line1, this.line2, newCity, this.stateCode, this.zip);
    }

    public withStateCode(newStateCode: string) {
        return new Address(this.name, this.line1, this.line2, this.city, newStateCode, this.zip);
    }

    public withZip(newZip: string) {
        return new Address(this.name, this.line1, this.line2, this.city, this.stateCode, newZip);
    }

    public get isPotentiallyValid(): boolean {
        return !!(this.name && this.line1 && this.city && this.zip && this.stateCode)
    }

    public toJson(): any {
        return {
            name: this.name,
            line1: this.line1,
            line2: this.line2,
            city: this.city,
            stateCode: this.stateCode,
            zip: this.zip,
        }
    }
}

export const states = new Map([
    ['Alabama', 'AL'],
    ['Alaska', 'AK'],
    ['American Samoa', 'AS'],
    ['Arizona', 'AZ'],
    ['Arkansas', 'AR'],
    ['Armed Forces Americas', 'AA'],
    ['Armed Forces Europe', 'AE'],
    ['Armed Forces Pacific', 'AP'],
    ['California', 'CA'],
    ['Colorado', 'CO'],
    ['Connecticut', 'CT'],
    ['Delaware', 'DE'],
    ['District Of Columbia', 'DC'],
    ['Florida', 'FL'],
    ['Georgia', 'GA'],
    ['Guam', 'GU'],
    ['Hawaii', 'HI'],
    ['Idaho', 'ID'],
    ['Illinois', 'IL'],
    ['Indiana', 'IN'],
    ['Iowa', 'IA'],
    ['Kansas', 'KS'],
    ['Kentucky', 'KY'],
    ['Louisiana', 'LA'],
    ['Maine', 'ME'],
    ['Marshall Islands', 'MH'],
    ['Maryland', 'MD'],
    ['Massachusetts', 'MA'],
    ['Michigan', 'MI'],
    ['Minnesota', 'MN'],
    ['Mississippi', 'MS'],
    ['Missouri', 'MO'],
    ['Montana', 'MT'],
    ['Nebraska', 'NE'],
    ['Nevada', 'NV'],
    ['New Hampshire', 'NH'],
    ['New Jersey', 'NJ'],
    ['New Mexico', 'NM'],
    ['New York', 'NY'],
    ['North Carolina', 'NC'],
    ['North Dakota', 'ND'],
    ['Northern Mariana Islands', 'NP'],
    ['Ohio', 'OH'],
    ['Oklahoma', 'OK'],
    ['Oregon', 'OR'],
    ['Pennsylvania', 'PA'],
    ['Puerto Rico', 'PR'],
    ['Rhode Island', 'RI'],
    ['South Carolina', 'SC'],
    ['South Dakota', 'SD'],
    ['Tennessee', 'TN'],
    ['Texas', 'TX'],
    ['US Virgin Islands', 'VI'],
    ['Utah', 'UT'],
    ['Vermont', 'VT'],
    ['Virginia', 'VA'],
    ['Washington', 'WA'],
    ['West Virginia', 'WV'],
    ['Wisconsin', 'WI'],
    ['Wyoming', 'WY'],
]);
