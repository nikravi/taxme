import { EthEvent } from "./TaxCollector";


export default interface Sale extends EthEvent {
    company: string;
    amount: string;
    regionalTaxAmount: string;
    nationalTaxAmount: string;
}