import oracledb from "oracledb"

interface DatabaseConfig {
  host: string
  port: number
  database: string
  user: string
  password: string
}

// Oracle database class with real connection
export class OracleDatabase {
  private config: DatabaseConfig
  private pool: oracledb.Pool | null = null

  constructor(config: DatabaseConfig) {
    this.config = config
    // Configure Oracle client
    oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT
    oracledb.autoCommit = true
  }

  async connect() {
    try {
      console.log("Connecting to Oracle database...")

      // Create connection pool for better performance
      this.pool = await oracledb.createPool({
        user: this.config.user,
        password: this.config.password,
        connectString: `${this.config.host}:${this.config.port}/${this.config.database}`,
        poolMin: 2,
        poolMax: 10,
        poolIncrement: 1,
        poolTimeout: 300,
        stmtCacheSize: 23,
      })

      console.log("Oracle connection pool created successfully")
    } catch (error) {
      console.error("Error connecting to Oracle database:", error)
      throw error
    }
  }

  async executeFunction(functionName: string, params: any[]): Promise<any> {
    let connection: oracledb.Connection | undefined

    try {
      if (!this.pool) {
        await this.connect()
      }

      connection = await this.pool!.getConnection()

      if (functionName === "FNC_CHECK_SHBG") {
        // Execute the actual Oracle function
        const result = await connection.execute(
          `BEGIN :result := FNC_CHECK_SHBG(:service_code, :shbg, :pocode, :recnational, :is_package_incident); END;`,
          {
            result: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
            service_code: params[0],
            shbg: params[1],
            pocode: params[2] || null,
            recnational: params[3] || null,
            is_package_incident: params[4] || "0",
          },
        )

        return result.outBinds?.result
      }

      throw new Error(`Function ${functionName} not implemented`)
    } catch (error) {
      console.error(`Error executing function ${functionName}:`, error)
      throw error
    } finally {
      if (connection) {
        try {
          await connection.close()
        } catch (error) {
          console.error("Error closing connection:", error)
        }
      }
    }
  }

  // Kiểm tra mã vận đơn đã tồn tại trong bảng PORTAL_ITEM_DTL
  async checkShbgExists(ttNumber: string): Promise<boolean> {
    let connection: oracledb.Connection | undefined

    try {
      if (!this.pool) {
        await this.connect()
      }

      connection = await this.pool!.getConnection()

      console.log(`Checking if TT_NUMBER ${ttNumber} exists in PORTAL_ITEM_DTL...`)

      const result = await connection.execute(
        `SELECT COUNT(*) as count FROM PORTAL_ITEM_DTL WHERE TT_NUMBER = :tt_number`,
        { tt_number: ttNumber },
      )

      const count = (result.rows as any[])[0]?.COUNT || 0
      console.log(`Found ${count} records for TT_NUMBER ${ttNumber}`)

      return count > 0
    } catch (error) {
      console.error("Error checking SHBG existence:", error)
      // Return false on error to allow code generation to continue
      return false
    } finally {
      if (connection) {
        try {
          await connection.close()
        } catch (error) {
          console.error("Error closing connection:", error)
        }
      }
    }
  }

  // Lấy thông tin chi tiết mã vận đơn từ PORTAL_ITEM_DTL
  async getShbgDetails(ttNumber: string): Promise<any> {
    let connection: oracledb.Connection | undefined

    try {
      if (!this.pool) {
        await this.connect()
      }

      connection = await this.pool!.getConnection()

      console.log(`Getting details for TT_NUMBER ${ttNumber} from PORTAL_ITEM_DTL...`)

      const result = await connection.execute(
        `SELECT TT_NUMBER, SERVICE_CODE, PO_CODE, CREATED_DATE, STATUS,
                SENDER_NAME, RECEIVER_NAME, WEIGHT, AMOUNT
         FROM PORTAL_ITEM_DTL
         WHERE TT_NUMBER = :tt_number`,
        { tt_number: ttNumber },
      )

      return (result.rows as any[])[0] || null
    } catch (error) {
      console.error("Error getting SHBG details:", error)
      return null
    } finally {
      if (connection) {
        try {
          await connection.close()
        } catch (error) {
          console.error("Error closing connection:", error)
        }
      }
    }
  }


  // Lấy lịch sử mã vận đơn từ PORTAL_ITEM_DTL
  async getShbgHistory(limit = 50): Promise<
    Array<{
      ttNumber: string
      serviceCode: string
      createdDate: string
      status: string
      poCode?: string
      senderName?: string
      receiverName?: string
    }>
  > {
    let connection: oracledb.Connection | undefined

    try {
      if (!this.pool) {
        await this.connect()
      }

      connection = await this.pool!.getConnection()

      console.log(`Getting SHBG history from PORTAL_ITEM_DTL (limit: ${limit})...`)

      const result = await connection.execute(
        `SELECT TT_NUMBER, SERVICE_CODE, PO_CODE, CREATED_DATE, STATUS,
                SENDER_NAME, RECEIVER_NAME
         FROM PORTAL_ITEM_DTL
         ORDER BY CREATED_DATE DESC
         FETCH FIRST :limit ROWS ONLY`,
        { limit },
      )

      return (result.rows as any[]).map((row) => ({
        ttNumber: row.TT_NUMBER,
        serviceCode: row.SERVICE_CODE,
        createdDate: row.CREATED_DATE?.toISOString() || "",
        status: row.STATUS,
        poCode: row.PO_CODE,
        senderName: row.SENDER_NAME,
        receiverName: row.RECEIVER_NAME,
      }))
    } catch (error) {
      console.error("Error getting SHBG history:", error)
      return []
    } finally {
      if (connection) {
        try {
          await connection.close()
        } catch (error) {
          console.error("Error closing connection:", error)
        }
      }
    }
  }

  // Tìm kiếm mã vận đơn trong PORTAL_ITEM_DTL
  async searchShbg(searchTerm: string): Promise<
    Array<{
      ttNumber: string
      serviceCode: string
      createdDate: string
      status: string
      poCode?: string
      senderName?: string
      receiverName?: string
    }>
  > {
    let connection: oracledb.Connection | undefined

    try {
      if (!this.pool) {
        await this.connect()
      }

      connection = await this.pool!.getConnection()

      console.log(`Searching SHBG in PORTAL_ITEM_DTL with term: ${searchTerm}...`)

      const result = await connection.execute(
        `SELECT TT_NUMBER, SERVICE_CODE, PO_CODE, CREATED_DATE, STATUS,
                SENDER_NAME, RECEIVER_NAME
         FROM PORTAL_ITEM_DTL
         WHERE UPPER(TT_NUMBER) LIKE '%' || UPPER(:search_term) || '%'
            OR UPPER(SERVICE_CODE) LIKE '%' || UPPER(:search_term) || '%'
            OR UPPER(SENDER_NAME) LIKE '%' || UPPER(:search_term) || '%'
            OR UPPER(RECEIVER_NAME) LIKE '%' || UPPER(:search_term) || '%'
         ORDER BY CREATED_DATE DESC`,
        { search_term: searchTerm },
      )

      return (result.rows as any[]).map((row) => ({
        ttNumber: row.TT_NUMBER,
        serviceCode: row.SERVICE_CODE,
        createdDate: row.CREATED_DATE?.toISOString() || "",
        status: row.STATUS,
        poCode: row.PO_CODE,
        senderName: row.SENDER_NAME,
        receiverName: row.RECEIVER_NAME,
      }))
    } catch (error) {
      console.error("Error searching SHBG:", error)
      return []
    } finally {
      if (connection) {
        try {
          await connection.close()
        } catch (error) {
          console.error("Error closing connection:", error)
        }
      }
    }
  }

  // Lấy danh sách mã tỉnh từ database
  async getProvinceCodes(): Promise<string[]> {
    let connection: oracledb.Connection | undefined

    try {
      if (!this.pool) {
        await this.connect()
      }

      connection = await this.pool!.getConnection()

      // Query actual province codes from your database
      // Adjust table name and column name according to your schema
      const result = await connection.execute(
        `SELECT DISTINCT SUBSTR(TT_NUMBER, 3, 2) as PROVINCE_CODE
         FROM PORTAL_ITEM_DTL
         WHERE TT_NUMBER IS NOT NULL
           AND LENGTH(TT_NUMBER) = 13
           AND REGEXP_LIKE(SUBSTR(TT_NUMBER, 3, 2), '^[0-9]{2}$')
         ORDER BY PROVINCE_CODE`,
      )

      const codes = (result.rows as any[]).map((row) => row.PROVINCE_CODE)

      // Fallback to default codes if no data found
      if (codes.length === 0) {
        return [
          "01",
          "02",
          "04",
          "06",
          "08",
          "10",
          "12",
          "14",
          "15",
          "17",
          "19",
          "20",
          "22",
          "24",
          "25",
          "26",
          "27",
          "30",
          "31",
          "33",
          "34",
          "35",
          "36",
          "37",
          "38",
          "40",
          "42",
          "44",
          "45",
          "46",
          "48",
          "49",
          "51",
          "52",
          "54",
          "56",
          "58",
          "60",
          "62",
          "64",
          "66",
          "67",
          "68",
          "70",
          "72",
          "74",
          "75",
          "77",
          "79",
          "80",
          "82",
          "83",
          "84",
          "86",
          "87",
          "89",
          "91",
          "92",
          "93",
          "94",
          "95",
          "96",
        ]
      }

      return codes
    } catch (error) {
      console.error("Error getting province codes:", error)
      // Return default codes on error
      return [
        "01",
        "02",
        "04",
        "06",
        "08",
        "10",
        "12",
        "14",
        "15",
        "17",
        "19",
        "20",
        "22",
        "24",
        "25",
        "26",
        "27",
        "30",
        "31",
        "33",
        "34",
        "35",
        "36",
        "37",
        "38",
        "40",
        "42",
        "44",
        "45",
        "46",
        "48",
        "49",
        "51",
        "52",
        "54",
        "56",
        "58",
        "60",
        "62",
        "64",
        "66",
        "67",
        "68",
        "70",
        "72",
        "74",
        "75",
        "77",
        "79",
        "80",
        "82",
        "83",
        "84",
        "86",
        "87",
        "89",
        "91",
        "92",
        "93",
        "94",
        "95",
        "96",
      ]
    } finally {
      if (connection) {
        try {
          await connection.close()
        } catch (error) {
          console.error("Error closing connection:", error)
        }
      }
    }
  }

  // Lấy trace codes từ bảng portal_check_tracecode
  async getTraceCodes(poCode?: string): Promise<string[]> {
    let connection: oracledb.Connection | undefined

    try {
      if (!this.pool) {
        await this.connect()
      }

      connection = await this.pool!.getConnection()

      let query = `SELECT DISTINCT trace_number FROM portal_check_tracecode`
      let params: any = {}

      if (poCode) {
        // Get trace codes for specific province based on PO code
        query = `
          SELECT t.trace_number 
          FROM portal_check_tracecode t, 
               (SELECT t2.parent_code 
                FROM (SELECT a.* 
                      FROM mcas_organization_standard a 
                      WHERE a.unit_code = :po_code 
                        AND a.status = 1) t1, 
                     mcas_organization_standard t2 
                WHERE t1.parent_code = t2.unit_code) x 
          WHERE t.province_code = x.parent_code
        `
        params = { po_code: poCode }
      }

      const result = await connection.execute(query, params)
      return (result.rows as any[]).map((row) => row.TRACE_NUMBER || row.trace_number)
    } catch (error) {
      console.error("Error getting trace codes:", error)
      return []
    } finally {
      if (connection) {
        try {
          await connection.close()
        } catch (error) {
          console.error("Error closing connection:", error)
        }
      }
    }
  }

  async disconnect() {
    try {
      if (this.pool) {
        console.log("Closing Oracle connection pool...")
        await this.pool.close(10) // 10 seconds timeout
        this.pool = null
        console.log("Oracle connection pool closed successfully")
      }
    } catch (error) {
      console.error("Error closing Oracle connection pool:", error)
    }
  }
}

// Export a singleton instance
export const db = new OracleDatabase({
  host: process.env.ORACLE_HOST || "localhost",
  port: Number.parseInt(process.env.ORACLE_PORT || "1521"),
  database: process.env.ORACLE_DATABASE || "XE",
  user: process.env.ORACLE_USER || "system",
  password: process.env.ORACLE_PASSWORD || "password",
})

// Initialize connection on startup
db.connect().catch(console.error)
