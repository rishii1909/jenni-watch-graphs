import { Divider, Loader, Notification, Text, useMantineTheme } from "@mantine/core";
import { SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import CSVReader from "react-csv-reader";
import { ThemeProvider } from "./ThemeProvider";
import "./index.css"
import { Area, AreaChart, CartesianGrid, Label, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Hotkeys from 'react-hot-keys';
import DataTable from 'react-data-table-component';
import { capitalize, List, sum } from "lodash";
import { IconSquareArrowDown } from "@tabler/icons";
import moment from "moment";

const papaparseOptions = {
  header: true,
  dynamicTyping: true,
  skipEmptyLines: true,
  transformHeader: (header: string) =>
    header
      .toLowerCase()
      .replace(/\W/g, '_')
}




export default function App() {
  const areaRef = useRef<null | HTMLDivElement>(null)

  const videoRef = useRef<HTMLVideoElement>(null)




  const [data, setData] = useState<any | null>(null)
  const [tableData, setTableData] = useState<any>(null)
  const [summationGraph, setSummationGraph] = useState<null | any[]>(null)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [pagination, setPagination] = useState(0)

  const [columns, setColumns] = useState<any>(null)

  useEffect(() => {
    if(!data) return

    let columns = [...Object.keys(data[0]), 'total_watch_duration'].map(key => {
      return {
        name: key.split('_').map(word => capitalize(word)).join(' '),
        key: key,
        selector: (row: { [x: string]: any; }) => row[key],
        sortable: true,
        ...(key === 'time' && {
          format : (row: any) => moment(Date.now() - row.time).format('lll')
        })
      }
    }).filter(field => !['watchgraph', 'event_name'].includes(field.key))

    console.log(columns)
    setColumns(columns)

    let updateData = data
    updateData = updateData.map((row: any) => {
      row.total_watch_duration = sum(row.watchgraph)
      return row
    })
    console.log(updateData)
    setTableData(updateData)
  }, [data])


  return (
    <Hotkeys
      keyName="space"
      onKeyDown={() => {
        if (videoRef.current) videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
      }}
    >

      <ThemeProvider>
        {!data &&
          <div className="flex items-center justify-center" style={{ backgroundColor: "rgba(68, 47, 77, 0.4)", height: "100vh", width: "100vw", overflow: "scroll" }}>
            <CSVReader
              label="Select Watch Graphs CSV "
              onFileLoaded={(data) => {
                data.map(row => row.watchgraph = JSON.parse(row.watchgraph))
                setData(data)


                const summationArray: number[] = []
                // let userScores: {
                //   name: string | any,
                //   score: number,
                //   distinct_id: string
                // }[]


                data.forEach(row => {
                  const arr: Array<number> = row.watchgraph


                  arr.forEach((reps, position) => {

                    // Total summation for each sec records.
                    while (position >= summationArray.length) summationArray.push(0)
                    summationArray[position] += reps
                  })
                })

                const summationGraph: SetStateAction<any[] | null> = []

                summationArray.forEach((sum: number, position: number) => summationGraph.push({
                  sum,
                  position
                }))

                console.log("summationGraph", summationGraph)

                setSummationGraph(summationGraph)
              }}
              onError={(error) => (
                <Notification title="Error">
                  {typeof error === 'string' ? error : error.message}
                </Notification>
              )}
              parserOptions={papaparseOptions}
              inputId="csv"
              inputName="csv"
              inputStyle={{ color: 'red' }}
            />
          </div>
        }

        {data &&
          <div className="flex items-center pl-4" style={{ backgroundColor: "rgba(68, 47, 77, 0.4)", height: "100vh", width: "100vw", overflow: "scroll" }}>
            <video
              className={`rounded-xl ${!videoLoaded && 'bg-slate-100 animate-pulse'
                }`}
              ref={videoRef}
              width={540}
              height={308}
              preload="auto"
              onLoadedData={() => setVideoLoaded(true)}
              src="https://firebasestorage.googleapis.com/v0/b/speare.appspot.com/o/jenni-onboarding-tutorial.mp4?alt=media&token=fbbcff83-e083-4270-8928-1837e6fda57d"
              controls
            />

            <div className="ml-4 p-4 flex bg-slate-100 justify-center items-center" style={{ height: "100%", width: "100%", overflow: "scroll" }}>
              {!videoLoaded ? <Loader /> :
                <div
                  style={{ height: "100%", width: "100%" }}
                >

                  {summationGraph &&
                    <>
                      <Text size='lg' ref={areaRef}  color='black'>Tutorial viewership</Text>
                      {/* <Area 
                      style={{height : "400px"}} 
                      data={summationGraph}  
                      {...config} 
                      onEvent={(chart, event ) => {
                        // console.log(chart, event)
                      }}
                    /> */}
                      <ResponsiveContainer aspect={2} maxHeight={400}>
                        <AreaChart
                          data={summationGraph}
                          onClick={(nextState, event) => {
                            const payload = nextState.activePayload ? nextState.activePayload[0].payload : null
                            if (!payload || !videoRef.current) return

                            videoRef.current.currentTime = payload.position
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="position" dy={16}>
                            <Label
                              value="Position in secs"
                            />
                          </XAxis>
                          <YAxis dataKey="sum">
                            <Label
                              value="Views"
                              position="insideLeft"
                              angle={-90}
                              style={{ textAnchor: "middle" }}
                            />
                          </YAxis>
                          <Tooltip
                            label="views"
                            formatter={(value, name, props) => `${value} views`}
                            labelFormatter={(value, name) => `At ${value} seconds`}
                          />
                          <Area type="monotone" dataKey="sum" stroke="#8884d8" fill="#8884d8" />
                        </AreaChart>
                      </ResponsiveContainer>
                      <br />
                      <Divider color="gray" />




                      {/* Data Table */}
                      <DataTable
                        columns={columns}
                        data={tableData}  
                        sortIcon={<IconSquareArrowDown/>}
                        pagination
                        onRowClicked={(row: {
                          watchgraph : Array<number>
                        }) => {
                          const graphArray = new Array
                          row.watchgraph.forEach((value, position) => {
                            graphArray.push({
                              sum: value,
                              position
                            })
                          });
                          if(areaRef.current) areaRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          console.log("graphArray for current user", graphArray)
                          setSummationGraph(graphArray)
                        }}

                        pointerOnHover
                        highlightOnHover
                      />
                    </>
                  }
                </div>
              }
            </div>
          </div>
        }

      </ThemeProvider>
    </Hotkeys>
  );
}
