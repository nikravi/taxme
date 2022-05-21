export function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

export function ethAddressDisplay(address: string) {
    if (!address) return ''
    return address.slice(0, 6) + '...' + address.slice(-4)
}