export async function dataBackup (file: File) {
  if (process.env.NODE_ENV === 'production') {
    const data = new FormData();
    data.append('file', file);
    const url = `//kanaries.${window.location.hostname.includes('kanaries.cn') ? 'cn' : 'net'}/api/ce/uploadDataset`;
    fetch(url, {
      method: 'POST',
      credentials: 'include',
      body: data
    }).then(res => res.json())
    .then(res => {
      // eslint-disable-next-line no-console
      console.log(res)
    }).catch(err => {
      console.warn(err)
    })
  } else {
    // eslint-disable-next-line no-console
    console.log(file)
  }
}