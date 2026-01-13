import { useState } from 'react'
import './App.css'

function App() {
  const [decimalValue, setDecimalValue] = useState('')
  const [binaryValue, setBinaryValue] = useState('')
  const [hexValue, setHexValue] = useState('')
  const [base64Value, setBase64Value] = useState('')
  const [asciiValue, setAsciiValue] = useState('')
  
  const [errors, setErrors] = useState({
    decimal: '',
    binary: '',
    hex: '',
    base64: '',
    ascii: ''
  })

  // Evaluate mathematical expression
  const evaluateExpression = (expr) => {
    try {
      // Remove spaces
      expr = expr.replace(/\s/g, '')
      
      // Security: only allow numbers and specific operators
      if (!/^[0-9+\-*/%()&|^<>~\s]+$/.test(expr)) {
        return null
      }
      
      // Using Function constructor is safer than eval for controlled expressions
      const result = Function('"use strict"; return (' + expr + ')')()
      
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return Math.floor(result) // Return integer only
      }
      
      return null
    } catch (e) {
      return null
    }
  }

  // Evaluate binary expression with bit-preserving shifts
  const evaluateBinaryExpression = (expr) => {
    try {
      // Remove spaces
      expr = expr.replace(/\s/g, '')
      
      // Check for shift operations
      const shiftMatch = expr.match(/^([01]+)\s*(<<|>>)\s*(\d+)$/)
      if (shiftMatch) {
        const binaryNum = shiftMatch[1]
        const operator = shiftMatch[2]
        const shiftAmount = parseInt(shiftMatch[3], 10)
        const originalBits = binaryNum.length
        
        const num = parseInt(binaryNum, 2)
        let result
        
        if (operator === '<<') {
          result = num << shiftAmount
          // Check if result fits in original bit width
          const maxVal = Math.pow(2, originalBits) - 1
          if (result > maxVal) {
            // Grow bit width for left shift overflow
            return { value: result, preserveBits: false }
          } else {
            // Preserve bit width
            return { value: result, preserveBits: true, bitWidth: originalBits }
          }
        } else { // >>
          result = num >> shiftAmount
          // Always preserve bit width for right shift
          return { value: result, preserveBits: true, bitWidth: originalBits }
        }
      }
      
      // Replace binary numbers with decimal equivalents for other operations
      const converted = expr.replace(/[01]+/g, (match) => {
        return parseInt(match, 2).toString()
      })
      
      const result = evaluateExpression(converted)
      return result !== null ? { value: result, preserveBits: false } : null
    } catch (e) {
      return null
    }
  }

  // Evaluate hex expression (convert to decimal first)
  const evaluateHexExpression = (expr) => {
    try {
      // Remove spaces
      expr = expr.replace(/\s/g, '').toUpperCase()
      
      // Replace hex numbers with decimal equivalents
      // Match hex patterns (sequences of 0-9A-F)
      const converted = expr.replace(/[0-9A-F]+/g, (match) => {
        return parseInt(match, 16).toString()
      })
      
      return evaluateExpression(converted)
    } catch (e) {
      return null
    }
  }

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

  // Convert hex string to ASCII if it represents valid bytes
  const hexToAscii = (hexStr) => {
    if (!hexStr || hexStr.length === 0 || hexStr.length % 2 !== 0) {
      return ''
    }
    
    let result = ''
    for (let i = 0; i < hexStr.length; i += 2) {
      const byte = parseInt(hexStr.substr(i, 2), 16)
      if (byte >= 32 && byte <= 126) {
        result += String.fromCharCode(byte)
      } else {
        return '' // Not all bytes are printable ASCII
      }
    }
    return result
  }

  // Convert binary string to ASCII if it represents valid bytes
  const binaryToAscii = (binaryStr) => {
    if (!binaryStr || binaryStr.length === 0 || binaryStr.length % 8 !== 0) {
      return ''
    }
    
    let result = ''
    for (let i = 0; i < binaryStr.length; i += 8) {
      const byte = parseInt(binaryStr.substr(i, 8), 2)
      if (byte >= 32 && byte <= 126) {
        result += String.fromCharCode(byte)
      } else {
        return '' // Not all bytes are printable ASCII
      }
    }
    return result
  }

  // Convert ASCII string to hex
  const asciiToHex = (asciiStr) => {
    let result = ''
    for (let i = 0; i < asciiStr.length; i++) {
      const hex = asciiStr.charCodeAt(i).toString(16).toUpperCase()
      result += hex.padStart(2, '0')
    }
    return result
  }

  // Convert from decimal to all other formats
  const fromDecimal = (value, sourceBinary = '', preserveBitWidth = 0) => {
    if (value === '' || value === '-') {
      return { binary: '', hex: '', base64: '', ascii: '', signedDecimal: '', bitLength: '' }
    }
    
    const num = parseInt(value, 10)
    if (isNaN(num)) {
      return null
    }

    let binary = num >= 0 ? num.toString(2) : '-' + Math.abs(num).toString(2)
    
    // Preserve bit width if specified (for shifts)
    if (preserveBitWidth > 0 && num >= 0) {
      binary = num.toString(2).padStart(preserveBitWidth, '0')
    }
    
    const hex = num >= 0 ? num.toString(16).toUpperCase() : '-' + Math.abs(num).toString(16).toUpperCase()
    const base64 = btoa(num.toString())
    
    // ASCII (only if single byte in printable range)
    let ascii = ''
    if (num >= 32 && num <= 126) {
      ascii = String.fromCharCode(num)
    }

    // Calculate signed decimal and bit length from the binary representation
    let signedDecimal = ''
    let bitLength = ''
    
    if (num >= 0) {
      // Use source binary if provided (to preserve leading zeros), otherwise use calculated
      const binaryStr = sourceBinary || binary
      const bits = binaryStr.length
      
      // Only show two's complement if MSB is 1
      if (binaryStr[0] === '1') {
        const signedNum = fromTwosComplement(binaryStr, bits)
        signedDecimal = signedNum !== null ? signedNum.toString() : ''
      }
      
      bitLength = bits.toString()
    }

    return { binary, hex, base64, ascii, signedDecimal, bitLength }
  }

  // Handle decimal input with expression evaluation
  const handleDecimalChange = (e) => {
    const value = e.target.value
    setDecimalValue(value)
    
    if (value === '' || value === '-') {
      setBinaryValue('')
      setHexValue('')
      setBase64Value('')
      setAsciiValue('')
      setErrors({ ...errors, decimal: '' })
      return
    }
    
    // Try to parse as a simple number first
    let num = parseInt(value.replace(/\s/g, ''), 10)
    
    // If it's not a simple number, don't evaluate yet (wait for Enter)
    if (isNaN(num)) {
      setErrors({ ...errors, decimal: '' })
      return
    }
    
    setErrors({ ...errors, decimal: '' })
    
    const converted = fromDecimal(num.toString())
    if (converted) {
      setBinaryValue(converted.binary)
      setHexValue(converted.hex)
      setBase64Value(converted.base64)
      setAsciiValue(converted.ascii)
    }
  }

  // Handle Enter key for expression evaluation in decimal
  const handleDecimalKeyDown = (e) => {
    if (e.key === 'Enter') {
      const value = decimalValue.replace(/\s/g, '')
      
      // Try to evaluate as expression
      const result = evaluateExpression(value)
      
      if (result !== null) {
        setDecimalValue(result.toString())
        setErrors({ ...errors, decimal: '' })
        
        const converted = fromDecimal(result.toString())
        if (converted) {
          setBinaryValue(converted.binary)
          setHexValue(converted.hex)
          setBase64Value(converted.base64)
          setAsciiValue(converted.ascii)
        }
      } else {
        // Check if it's just a number
        const num = parseInt(value, 10)
        if (isNaN(num)) {
          setErrors({ ...errors, decimal: 'Invalid expression' })
        }
      }
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
      setAsciiValue('')
      setErrors({ ...errors, binary: '' })
      return
    }
    
    const cleanValue = value.replace(/\s/g, '') // Remove spaces
    const isNegative = cleanValue.startsWith('-')
    const binaryPart = isNegative ? cleanValue.slice(1) : cleanValue
    
    if (!/^[01+\-*/%()&|^<>~]+$/.test(binaryPart)) {
      setErrors({ ...errors, binary: 'Only 0, 1, and operators allowed' })
      return
    }
    
    setErrors({ ...errors, binary: '' })
    
    // Check if it's just a plain binary number (no operators)
    if (/^[01]+$/.test(binaryPart)) {
      // Plain binary number
      const num = parseInt(binaryPart, 2) * (isNegative ? -1 : 1)
      setDecimalValue(num.toString())
      
      // Try to convert to ASCII if aligned to 8 bits
      const ascii = binaryToAscii(binaryPart)
      setAsciiValue(ascii)
      
      // Pass the original binary string to preserve leading zeros
      const converted = fromDecimal(num.toString(), binaryPart)
      if (converted) {
        setHexValue(converted.hex)
        setBase64Value(converted.base64)
      }
    }
  }

  // Handle Enter key for expression evaluation in binary
  const handleBinaryKeyDown = (e) => {
    if (e.key === 'Enter') {
      const value = binaryValue.replace(/\s/g, '')
      
      // Try to evaluate as expression
      const result = evaluateBinaryExpression(value)
      
      if (result !== null) {
        const num = result.value
        setDecimalValue(num.toString())
        setErrors({ ...errors, binary: '' })
        
        const converted = fromDecimal(num.toString(), '', result.preserveBits ? result.bitWidth : 0)
        if (converted) {
          setBinaryValue(converted.binary)
          setHexValue(converted.hex)
          setBase64Value(converted.base64)
          setAsciiValue(converted.ascii)
        }
      } else {
        const cleanValue = value.replace(/-/g, '')
        if (!/^[01]+$/.test(cleanValue)) {
          setErrors({ ...errors, binary: 'Invalid expression' })
        }
      }
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
      setAsciiValue('')
      setErrors({ ...errors, hex: '' })
      return
    }
    
    const cleanValue = value.replace(/\s/g, '') // Remove spaces
    const isNegative = cleanValue.startsWith('-')
    const hexPart = isNegative ? cleanValue.slice(1) : cleanValue
    
    if (!/^[0-9A-F+\-*/%()&|^<>~]+$/.test(hexPart)) {
      setErrors({ ...errors, hex: 'Only 0-9, A-F, and operators allowed' })
      return
    }
    
    setErrors({ ...errors, hex: '' })
    
    // Check if it's just a plain hex number (no operators)
    if (/^[0-9A-F]+$/.test(hexPart)) {
      // Plain hex number
      const num = parseInt(hexPart, 16) * (isNegative ? -1 : 1)
      setDecimalValue(num.toString())
      
      // Try to convert to ASCII if even number of hex digits
      const ascii = hexToAscii(hexPart)
      setAsciiValue(ascii)
      
      // Get binary representation with proper bit length
      const binaryStr = parseInt(hexPart, 16).toString(2)
      const converted = fromDecimal(num.toString(), binaryStr)
      if (converted) {
        setBinaryValue(converted.binary)
        setBase64Value(converted.base64)
      }
    }
  }

  // Handle Enter key for expression evaluation in hex
  const handleHexKeyDown = (e) => {
    if (e.key === 'Enter') {
      const value = hexValue.replace(/\s/g, '')
      
      // Try to evaluate as expression
      const result = evaluateHexExpression(value)
      
      if (result !== null) {
        setDecimalValue(result.toString())
        setErrors({ ...errors, hex: '' })
        
        const converted = fromDecimal(result.toString())
        if (converted) {
          setBinaryValue(converted.binary)
          setHexValue(converted.hex)
          setBase64Value(converted.base64)
          setAsciiValue(converted.ascii)
        }
      } else {
        const cleanValue = value.replace(/-/g, '')
        if (!/^[0-9A-F]+$/.test(cleanValue)) {
          setErrors({ ...errors, hex: 'Invalid expression' })
        }
      }
    }
  }

  // Handle base64 input
  const handleBase64Change = (e) => {
    const value = e.target.value.replace(/\s/g, '') // Remove spaces
    setBase64Value(value)
    
    if (value === '') {
      setDecimalValue('')
      setBinaryValue('')
      setHexValue('')
      setAsciiValue('')
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
        setAsciiValue(converted.ascii)
      }
    } catch (err) {
      setErrors({ ...errors, base64: 'Invalid Base64 encoding' })
    }
  }

  // Handle ASCII input
  const handleAsciiChange = (e) => {
    const value = e.target.value
    setAsciiValue(value)
    
    if (value === '') {
      setDecimalValue('')
      setBinaryValue('')
      setHexValue('')
      setBase64Value('')
      setErrors({ ...errors, ascii: '' })
      return
    }
    
    // Check if all characters are printable ASCII
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i)
      if (code < 32 || code > 126) {
        setErrors({ ...errors, ascii: 'Only printable ASCII (32-126) allowed' })
        return
      }
    }
    
    setErrors({ ...errors, ascii: '' })
    
    // Convert to hex
    const hex = asciiToHex(value)
    setHexValue(hex)
    
    // Convert hex to binary
    const binary = parseInt(hex, 16).toString(2)
    setBinaryValue(binary)
    
    // Convert hex to decimal
    const decimal = parseInt(hex, 16)
    setDecimalValue(decimal.toString())
    
    // Convert to base64
    const base64 = btoa(value)
    setBase64Value(base64)
  }

  // Calculate derived values for display
  const num = parseInt(decimalValue, 10)
  // For derived values, use the original binary if available to preserve leading zeros
  const sourceBinary = binaryValue.replace(/\s/g, '').replace(/-/g, '')
  const useSourceBinary = /^[01]+$/.test(sourceBinary) ? sourceBinary : ''
  const derived = !isNaN(num) ? fromDecimal(decimalValue, useSourceBinary) : { signedDecimal: '', bitLength: '' }

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
              onKeyDown={handleDecimalKeyDown}
              placeholder="e.g., 32+53"
              className={errors.decimal ? 'error' : ''}
            />
            {errors.decimal && <span className="error-hint">{errors.decimal}</span>}
          </div>

          <div className="field">
            <label htmlFor="binary">Binary</label>
            <input
              id="binary"
              type="text"
              value={binaryValue}
              onChange={handleBinaryChange}
              onKeyDown={handleBinaryKeyDown}
              placeholder="e.g., 1010+11 or 100>>1"
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
              onKeyDown={handleHexKeyDown}
              placeholder="e.g., A+F"
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

          <div className="field">
            <label htmlFor="ascii">ASCII Text</label>
            <input
              id="ascii"
              type="text"
              value={asciiValue}
              onChange={handleAsciiChange}
              placeholder="Enter ASCII text"
              className={errors.ascii ? 'error' : ''}
            />
            {errors.ascii && <span className="error-hint">{errors.ascii}</span>}
          </div>
        </div>

        {/* Read-only Output Fields */}
        <div className="output-section">
          <h2>Interpretations</h2>
          
          <div className="field">
            <label>Signed Decimal (Two's Complement)</label>
            <input
              type="text"
              value={derived.signedDecimal}
              readOnly
              placeholder="Only when MSB = 1"
              className="readonly"
            />
          </div>

          <div className="field">
            <label>Bit Length</label>
            <input
              type="text"
              value={derived.bitLength}
              readOnly
              placeholder="-"
              className="readonly"
            />
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="info-card">
        <h3>How It Works</h3>
        <p>
          This converter translates numbers between different bases (decimal, binary, hexadecimal, base64, ASCII) 
          and shows various interpretations.
        </p>
        
        <h4>Two's Complement</h4>
        <p>
          The signed decimal shows the two's complement interpretation only when the most significant bit (MSB) is 1. 
          For example, <code>11100000</code> (8 bits) = 224 unsigned or -32 signed. But <code>00110101</code> has MSB = 0, 
          so it's already positive and no two's complement is shown.
        </p>
        
        <h4>Bit-Preserving Shifts</h4>
        <p>
          Right shifts (<code>&gt;&gt;</code>) always preserve bit length by padding with zeros on the left. 
          Left shifts (<code>&lt;&lt;</code>) preserve bit length unless the result overflows, in which case the bit width grows.
        </p>
        <ul>
          <li><code>100 &gt;&gt; 1</code> = <code>010</code> (3 bits preserved)</li>
          <li><code>001 &lt;&lt; 1</code> = <code>010</code> (3 bits preserved)</li>
          <li><code>100 &lt;&lt; 1</code> = <code>1000</code> (overflow, grows to 4 bits)</li>
        </ul>
        
        <h4>ASCII Text</h4>
        <p>
          Type text in the ASCII field to convert it to hex/binary. When entering hex or binary values with proper 
          byte alignment (hex: even digits, binary: multiple of 8 bits), the ASCII representation will appear if all 
          bytes are printable characters (32-126). For example, <code>3434</code> in hex displays as <code>44</code>.
        </p>
        
        <h4>Supported Operators (press Enter to evaluate)</h4>
        <p>Expressions work in Decimal, Binary, and Hex fields:</p>
        <ul>
          <li><strong>Arithmetic:</strong> <code>+</code> (add), <code>-</code> (subtract), <code>*</code> (multiply), <code>/</code> (divide), <code>%</code> (modulo)</li>
          <li><strong>Bitwise:</strong> <code>&</code> (AND), <code>|</code> (OR), <code>^</code> (XOR), <code>~</code> (NOT), <code>&lt;&lt;</code> (left shift), <code>&gt;&gt;</code> (right shift)</li>
          <li><strong>Grouping:</strong> <code>()</code> parentheses for order of operations</li>
        </ul>
        
        <h4>Examples</h4>
        <ul>
          <li>Decimal: <code>32 + 53</code> → 85</li>
          <li>Binary: <code>1010 + 11</code> → 13 (decimal)</li>
          <li>Binary: <code>100 &gt;&gt; 1</code> → <code>010</code></li>
          <li>Hex: <code>A + F</code> → 25 (decimal)</li>
          <li>Decimal: <code>15 & 7</code> → 7 (bitwise AND)</li>
          <li>ASCII: Type <code>Hello</code> → hex: <code>48656C6C6F</code></li>
        </ul>
      </div>
    </div>
  )
}

export default App
