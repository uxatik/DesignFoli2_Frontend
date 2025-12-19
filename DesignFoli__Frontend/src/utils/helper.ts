export const handleChangeData = (name: string, value: unknown, allData: {
    [key: string]: string | unknown
}, setAllData: (data: { [key: string]: string | unknown }) => void) => {
    return setAllData({
        ...allData,
        [name]: value
    })
}