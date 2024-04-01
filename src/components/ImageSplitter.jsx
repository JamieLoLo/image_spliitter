import React, { useEffect, useState } from 'react'
import JSZip from 'jszip'

function ImageSplitter() {
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
    const rowsColsMap = {
      small: 4,
      medium: 6,
      large: 10,
    }
    const numTiles = rowsColsMap[folder]
    const tileWidth = Math.ceil((img.width * scale) / numTiles)
    const tileHeight = Math.ceil((img.height * scale) / numTiles)
    const canvasWidth = tileWidth * numTiles
    const canvasHeight = tileHeight * numTiles

    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = canvasWidth
    tempCanvas.height = canvasHeight
    const tempCtx = tempCanvas.getContext('2d')

    // 图像居中绘制
    const offsetX = (canvasWidth - img.width * scale) / 2
    const offsetY = (canvasHeight - img.height * scale) / 2
    tempCtx.drawImage(
      img,
      offsetX,
      offsetY,
      img.width * scale,
      img.height * scale
    )

    let promises = []

    for (let i = 0; i < numTiles; i++) {
      for (let j = 0; j < numTiles; j++) {
        const canvas = document.createElement('canvas')
        canvas.width = tileWidth
        canvas.height = tileHeight
        const ctx = canvas.getContext('2d')

        ctx.drawImage(
          tempCanvas,
          j * tileWidth,
          i * tileHeight,
          tileWidth,
          tileHeight,
          0,
          0,
          tileWidth,
          tileHeight
        )

        const index = i * numTiles + j
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
      return {
        scale,
        rows: numTiles,
        cols: numTiles,
      }
    })
  }

  const downloadTiles = async () => {
    const img = new Image()
    img.src = `./origin_image/${imageName}`

    try {
      await new Promise((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject()
      })

      const zip = new JSZip()
      await Promise.all([
        splitAndSave(img, 1, zip, 'large'),
        splitAndSave(img, 0.6, zip, 'medium'),
        splitAndSave(img, 0.4, zip, 'small'),
      ])

      const tileDetails = await Promise.all([
        splitAndSave(img, 1, zip, 'large'),
        splitAndSave(img, 0.6, zip, 'medium'),
        splitAndSave(img, 0.4, zip, 'small'),
      ])

      const content = await zip.generateAsync({ type: 'blob' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(content)
      link.download = `${folderName}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      const newRecord = {
        recordFolder: folderName,
        smallRow: tileDetails.find((detail) => detail.scale === 0.4).rows,
        smallCol: tileDetails.find((detail) => detail.scale === 0.4).cols,
        mediumRow: tileDetails.find((detail) => detail.scale === 0.6).rows,
        mediumCol: tileDetails.find((detail) => detail.scale === 0.6).cols,
        largeRow: tileDetails.find((detail) => detail.scale === 1).rows,
        largeCol: tileDetails.find((detail) => detail.scale === 1).cols,
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
            </tr>
          </thead>
          <tbody>
            {recordDetails.map((el, index) => (
              <tr key={index}>
                <td className='py-1 border-2 border-black'>
                  {el.recordFolder}
                </td>
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
