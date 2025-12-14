import { useState } from 'react'
import './App.css'

function App() {
  const [decimalValue, setDecimalValue] = useState('')
  const [binaryValue, setBinaryValue] = useState('')
  const [hexValue, setHexValue] = useState('')
  const [base64Value, setBase64Value] = useState('')
  const [signedDecimal, setSignedDecimal] = useState('')
  
  const [errors, setErrors] = useState({
    decimal: '',
    binary: '',
    hex: '',
    base64: ''
  })

// Convert from two's complement to signed decimal
  const fromTwosComplement = (binaryStr, bits) => {
    if (!binaryStr || binaryStr.length === 0) {
      return null
    }
    
    const num = parseInt(binaryStr, 2)
    const maxSigned = Math.pow(2, bits - 1)
    
    // If the most significant bit is 1, it's negative
    if (num >= maxSigned) {
      return num - Math.pow(2, bits)
    }
    
    return num
  }

  // Determine bit width from binary string length
  const getBitWidth = (binaryStr) => {
    const len = binaryStr.length
    if (len <= 8) return 8
    if (len <= 16) return 16
    if (len <= 32) return 32
    return 64
  }

  // Convert to two's complement representation
  const toTwosComplement = (num, bits) => {
    const max = Math.pow(2, bits)
    const maxSigned = Math.pow(2, bits - 1)
    
    // Check if number is out of range
    if (num >= maxSigned || num < -maxSigned) {
      return 'Overflow'
    }
    
    let result
    if (num >= 0) {
      result = num
    } else {
      result = max + num
    }
    
    return result.toString(2).padStart(bits, '0')
  }

  // Convert from decimal to all other formats
  const fromDecimal = (value) => {
    if (value === '' || value === '-') {
      return { binary: '', hex: '', base64: '', twos8: '', twos16: '', twos32: '', twos64: '', ascii: '' }
    }
    
    const num = parseInt(value, 10)
    if (isNaN(num)) {
      return null
    }

    const binary = num >= 0 ? num.toString(2) : '-' + Math.abs(num).toString(2)
    const hex = num >= 0 ? num.toString(16).toUpperCase() : '-' + Math.abs(num).toString(16).toUpperCase()
    const base64 = btoa(num.toString())
    
    // Two's complement representations
    const twos8 = toTwosComplement(num, 8)
    const twos16 = toTwosComplement(num, 16)
    const twos32 = toTwosComplement(num, 32)
    const twos64 = toTwosComplement(num, 64)
    
    // ASCII (only if in printable range)
    const ascii = (num >= 32 && num <= 126) ? String.fromCharCode(num) : ''

    return { binary, hex, base64, twos8, twos16, twos32, twos64, ascii }
  }

  // Handle decimal input
  const handleDecimalChange = (e) => {
    const value = e.target.value
    setDecimalValue(value)
    setSignedDecimal('')
    
    if (value === '' || value === '-') {
      setBinaryValue('')
      setHexValue('')
      setBase64Value('')
      setErrors({ ...errors, decimal: '' })
      return
    }
    
    const num = parseInt(value, 10)
    if (isNaN(num)) {
      setErrors({ ...errors, decimal: 'Invalid decimal number' })
      return
    }
    
    setErrors({ ...errors, decimal: '' })
    const converted = fromDecimal(value)
    if (converted) {
      setBinaryValue(converted.binary)
      setHexValue(converted.hex)
      setBase64Value(converted.base64)
    }
  }

  // Handle binary input
  const handleBinaryChange = (e) => {
    const value = e.target.value
    setBinaryValue(value)
    
    if (value === '' || value === '-') {
      setDecimalValue('')
      setHexValue('')
      setBase64Value('')
      setSignedDecimal('')
      setErrors({ ...errors, binary: '' })
      return
    }
    
    const isNegative = value.startsWith('-')
    const binaryPart = isNegative ? value.slice(1) : value
    
    if (!/^[01]+$/.test(binaryPart)) {
      setErrors({ ...errors, binary: 'Only 0 and 1 allowed' })
      return
    }
    
    setErrors({ ...errors, binary: '' })
    
    // Unsigned interpretation
    const num = parseInt(binaryPart, 2) * (isNegative ? -1 : 1)
    setDecimalValue(num.toString())
    
    // Signed interpretation (two's complement)
    if (!isNegative) {
      const bits = getBitWidth(binaryPart)
      const signedNum = fromTwosComplement(binaryPart, bits)
      setSignedDecimal(signedNum !== null ? signedNum.toString() : '')
    } else {
      setSignedDecimal('')
    }
    
    const converted = fromDecimal(num.toString())
    if (converted) {
      setHexValue(converted.hex)
      setBase64Value(converted.base64)
    }
  }

  // Handle hex input
  const handleHexChange = (e) => {
    const value = e.target.value.toUpperCase()
    setHexValue(value)
    
    if (value === '' || value === '-') {
      setDecimalValue('')
      setBinaryValue('')
      setBase64Value('')
      setSignedDecimal('')
      setErrors({ ...errors, hex: '' })
      return
    }
    
    const isNegative = value.startsWith('-')
    const hexPart = isNegative ? value.slice(1) : value
    
    if (!/^[0-9A-F]+$/.test(hexPart)) {
      setErrors({ ...errors, hex: 'Only 0-9 and A-F allowed' })
      return
    }
    
    setErrors({ ...errors, hex: '' })
    
    // Unsigned interpretation
    const num = parseInt(hexPart, 16) * (isNegative ? -1 : 1)
    setDecimalValue(num.toString())
    
    // Signed interpretation (two's complement)
    if (!isNegative) {
      const binaryStr = parseInt(hexPart, 16).toString(2)
      const bits = getBitWidth(binaryStr)
      const signedNum = fromTwosComplement(binaryStr, bits)
      setSignedDecimal(signedNum !== null ? signedNum.toString() : '')
    } else {
      setSignedDecimal('')
    }
    
    const converted = fromDecimal(num.toString())
    if (converted) {
      setBinaryValue(converted.binary)
      setBase64Value(converted.base64)
    }
  }

  // Handle base64 input
  const handleBase64Change = (e) => {
    const value = e.target.value
    setBase64Value(value)
    setSignedDecimal('')
    
    if (value === '') {
      setDecimalValue('')
      setBinaryValue('')
      setHexValue('')
      setErrors({ ...errors, base64: '' })
      return
    }
    
    try {
      const decoded = atob(value)
      const num = parseInt(decoded, 10)
      
      if (isNaN(num)) {
        setErrors({ ...errors, base64: 'Invalid Base64 or not a number' })
        return
      }
      
      setErrors({ ...errors, base64: '' })
      setDecimalValue(num.toString())
      
      const converted = fromDecimal(num.toString())
      if (converted) {
        setBinaryValue(converted.binary)
        setHexValue(converted.hex)
      }
    } catch (err) {
      setErrors({ ...errors, base64: 'Invalid Base64 encoding' })
    }
  }

  // Calculate derived values for display
  const num = parseInt(decimalValue, 10)
  const derived = !isNaN(num) ? fromDecimal(decimalValue) : { twos8: '', twos16: '', twos32: '', twos64: '', ascii: '' }

  return (
    <div className="app">
      <h1>Number Base Converter</h1>
      
      <div className="converter-grid">
        {/* Input/Output Fields */}
        <div className="input-section">
          <h2>Input/Output</h2>
          
          <div className="field">
            <label htmlFor="decimal">Decimal</label>
            <input
              id="decimal"
              type="text"
              value={decimalValue}
              onChange={handleDecimalChange}
              placeholder="Enter decimal number"
              className={errors.decimal ? 'error' : ''}
            />
            {errors.decimal && <span className="error-hint">{errors.decimal}</span>}
          </div>

        <div className="field">
            <label>Signed Decimal (Two's Complement)</label>
            <input
              type="text"
              value={signedDecimal}
              readOnly
              placeholder="From binary/hex input"
              className="readonly"
            />
          </div>

          <div className="field">
            <label htmlFor="binary">Binary</label>
            <input
              id="binary"
              type="text"
              value={binaryValue}
              onChange={handleBinaryChange}
              placeholder="Enter binary number"
              className={errors.binary ? 'error' : ''}
            />
            {errors.binary && <span className="error-hint">{errors.binary}</span>}
          </div>

          <div className="field">
            <label htmlFor="hex">Hexadecimal</label>
            <input
              id="hex"
              type="text"
              value={hexValue}
              onChange={handleHexChange}
              placeholder="Enter hex number"
              className={errors.hex ? 'error' : ''}
            />
            {errors.hex && <span className="error-hint">{errors.hex}</span>}
          </div>

          <div className="field">
            <label htmlFor="base64">Base64</label>
            <input
              id="base64"
              type="text"
              value={base64Value}
              onChange={handleBase64Change}
              placeholder="Enter base64"
              className={errors.base64 ? 'error' : ''}
            />
            {errors.base64 && <span className="error-hint">{errors.base64}</span>}
          </div>
        </div>

        {/* Read-only Output Fields */}
        <div className="output-section">
          <h2>Two's Complement & ASCII</h2>
          
          <div className="field">
            <label>8-bit Two's Complement</label>
            <input
              type="text"
              value={derived.twos8}
              readOnly
              placeholder="-"
              className="readonly"
            />
          </div>

          <div className="field">
            <label>16-bit Two's Complement</label>
            <input
              type="text"
              value={derived.twos16}
              readOnly
              placeholder="-"
              className="readonly"
            />
          </div>

          <div className="field">
            <label>32-bit Two's Complement</label>
            <input
              type="text"
              value={derived.twos32}
              readOnly
              placeholder="-"
              className="readonly"
            />
          </div>

          <div className="field">
            <label>64-bit Two's Complement</label>
            <input
              type="text"
              value={derived.twos64}
              readOnly
              placeholder="-"
              className="readonly"
            />
          </div>

          <div className="field">
            <label>ASCII Character</label>
            <input
              type="text"
              value={derived.ascii}
              readOnly
              placeholder="(32-126 only)"
              className="readonly"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
