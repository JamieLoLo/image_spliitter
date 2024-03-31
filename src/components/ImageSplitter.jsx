import React, { useEffect, useState } from 'react'
import JSZip from 'jszip'

function ImageSplitter({ tileSize = 512 }) {
  const [folderName, setFolderName] = useState('')
  const [imageName, setImageName] = useState('')
  const [isImageNameEmpty, setIsImageNameEmpty] = useState(false)
  const [isFolderNameEmpty, setIsFolderNameEmpty] = useState(false)
  const [isImageExist, setIsImageExist] = useState(true)

  const [recordDetails, setRecordDetails] = useState(() => {
    const savedRecordDetails = localStorage.getItem('recordDetails')
    return savedRecordDetails ? JSON.parse(savedRecordDetails) : []
  })

  useEffect(() => {
    localStorage.setItem('recordDetails', JSON.stringify(recordDetails))
  }, [recordDetails])

  async function splitAndSave(img, scale, zip, folder) {
    const scaledWidth = img.width * scale
    const scaledHeight = img.height * scale
    const totalCols = Math.ceil(scaledWidth / tileSize)
    const totalRows = Math.ceil(scaledHeight / tileSize)
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = totalCols * tileSize
    tempCanvas.height = totalRows * tileSize
    const tempCtx = tempCanvas.getContext('2d')

    const offsetX = (tempCanvas.width - scaledWidth) / 2
    const offsetY = (tempCanvas.height - scaledHeight) / 2
    tempCtx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight)

    let promises = []

    for (let i = 0; i < totalRows; i++) {
      for (let j = 0; j < totalCols; j++) {
        const canvas = document.createElement('canvas')
        canvas.width = tileSize
        canvas.height = tileSize
        const ctx = canvas.getContext('2d')

        ctx.drawImage(
          tempCanvas,
          j * tileSize,
          i * tileSize,
          tileSize,
          tileSize,
          0,
          0,
          tileSize,
          tileSize
        )

        // 正確索引計算
        const index = i * totalCols + j
        const indexWithLeadingZeros = (index + 1).toString().padStart(3, '0')

        const promise = new Promise((resolve) => {
          canvas.toBlob((blob) => {
            zip.file(
              `${folderName}/${folder}/tile_${indexWithLeadingZeros}.webp`,
              blob
            )
            resolve()
          }, 'image/webp')
        })
        promises.push(promise)
      }
    }
    return Promise.all(promises).then(() => {
      // 在所有切片都處理好之後返回需要紀錄的數據
      return {
        scale,
        totalTiles: totalCols * totalRows,
      }
    })
  }

  const downloadTiles = async () => {
    const img = new Image()
    img.src = `../origin_image/${imageName}`

    try {
      await new Promise((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject()
      })

      const zip = new JSZip()
      await Promise.all([
        splitAndSave(img, 1, zip, 'large'),
        splitAndSave(img, 0.6, zip, 'medium'),
        splitAndSave(img, 0.3, zip, 'small'),
      ])

      const tileDetails = await Promise.all([
        splitAndSave(img, 1, zip, 'large'),
        splitAndSave(img, 0.6, zip, 'medium'),
        splitAndSave(img, 0.3, zip, 'small'),
      ])

      const content = await zip.generateAsync({ type: 'blob' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(content)
      link.download = `${folderName}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      const newRecord = {
        recordImage: imageName,
        recordFolder: folderName,
        smallTiles: tileDetails.find((detail) => detail.scale === 0.4)
          .totalTiles,
        mediumTiles: tileDetails.find((detail) => detail.scale === 0.6)
          .totalTiles,
        largeTiles: tileDetails.find((detail) => detail.scale === 1).totalTiles,
      }

      setRecordDetails((prev) => [...prev, newRecord])
      setImageName('')
      setImageName('')
    } catch (error) {
      setIsImageExist(false)
      console.error('Error loading image:', error)
    }
  }

  return (
    <div className='fixed top-0 left-0 screen-setting bg-mainBg-100 z-[999] pointer-events-auto overflow-y-scroll '>
      <div className='w-full h-full flex items-center justify-center'>
        <div className='flex flex-col justify-center w-[500px]  bg-mainOrange-100 py-[16px] rounded-[20px] px-[20px] tracking-[0px]'>
          <p className='text-[28px]  roboto-black '>"IMAGE SPLITTER"</p>

          <input
            type='text'
            value={imageName}
            onChange={(e) => {
              setImageName(e.target.value)
              setIsImageNameEmpty(false)
              setIsImageExist(true)
            }}
            placeholder='Image name*'
            className={`border-b-2 border-black bg-mainOrange-100 w-full placeholder:text-black mt-4 roboto-medium pb-1 focus:outline-none ${
              isImageNameEmpty ? 'border-white' : 'border-black'
            }`}
          />
          <input
            type='text'
            value={folderName}
            onChange={(e) => {
              setFolderName(e.target.value)
              setIsFolderNameEmpty(false)
            }}
            placeholder='Folder name*'
            className={`border-b-2  bg-mainOrange-100 w-full placeholder:text-black mt-4 roboto-medium pb-1 focus:outline-none ${
              isFolderNameEmpty ? 'border-white' : 'border-black'
            }`}
            required
          />

          <div className=' flex items-center  mt-6 '>
            <button
              onClick={() => {
                if (folderName.replace(/\s+/g, '').length === 0) {
                  setIsFolderNameEmpty(true)
                }
                if (imageName.replace(/\s+/g, '').length === 0) {
                  setIsImageNameEmpty(true)
                }
                if (
                  folderName.replace(/\s+/g, '').length !== 0 &&
                  imageName.replace(/\s+/g, '').length !== 0
                ) {
                  downloadTiles()
                }
              }}
              className='bg-black text-mainOrange-100 w-fit px-6 py-2  roboto-medium'
            >
              Download
            </button>
            {(isFolderNameEmpty || isImageNameEmpty || !isImageExist) && (
              <div className='ml-4 text-white roboto-regular'>
                {!isImageExist
                  ? `Image doesn't exist!`
                  : isFolderNameEmpty && isImageNameEmpty
                  ? `Folder name & image name are required.`
                  : isFolderNameEmpty
                  ? `Folder name is required.`
                  : `Image name is required.`}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className='w-full flex flex-col justify-center items-center text-center pb-[100px] mt-[100px]'>
        <table className=' select-text border-collapse'>
          <thead>
            <tr className='roboto-medium'>
              <th className='px-[20px] py-1 border-2 border-black'>
                Folder Name
              </th>
              <th className='px-[20px] py-1 border-2 border-black'>
                Image Name
              </th>
              <th className='px-[20px] py-1 border-2 border-black'>
                Small Tiles
              </th>
              <th className='px-[20px] py-1 border-2 border-black'>
                Medium Tiles
              </th>
              <th className='px-[20px] py-1 border-2 border-black'>
                Large Tiles
              </th>
            </tr>
          </thead>
          <tbody>
            {recordDetails.map((el, index) => (
              <tr key={index}>
                <td className='py-1 border-2 border-black'>
                  {el.recordFolder}
                </td>
                <td className='py-1 border-2 border-black'>{el.recordImage}</td>
                <td className='border-2 py-1 border-black'>{el.smallTiles}</td>
                <td className='border-2 py-1 border-black'>{el.mediumTiles}</td>
                <td className='border-2 py-1 border-black'>{el.largeTiles}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          onClick={() => {
            localStorage.clear()
            setRecordDetails([])
          }}
          className='bg-black text-mainBg-100 w-fit px-6 py-2  roboto-medium mt-[60px]'
        >
          Clear Data
        </button>
      </div>
    </div>
  )
}

export default ImageSplitter
