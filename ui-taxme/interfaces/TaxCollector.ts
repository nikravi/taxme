export interface EthEvent {
    address: string;
    transaction_hash: string;
    block_hash: string;
    block_number: number;
    createdAt: Date;
}

export default interface TaxCollector extends EthEvent {
    region: string;
    newTaxCollector: string;
}