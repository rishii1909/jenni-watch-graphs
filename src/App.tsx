import { Divider, Loader, Notification, RangeSlider, Switch, Text } from "@mantine/core";
import { SetStateAction, useEffect, useRef, useState } from "react";
import CSVReader from "react-csv-reader";
import { ThemeProvider } from "./ThemeProvider";
import "./index.css"
import { Area, AreaChart, CartesianGrid, Label, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Hotkeys from 'react-hot-keys';
import DataTable from 'react-data-table-component';
import { capitalize, max, mean, sum } from "lodash";
import { IconSquareArrowDown } from "@tabler/icons";

const papaparseOptions = {
  header: true,
  dynamicTyping: true,
  skipEmptyLines: true,
  transformHeader: (header: string) =>
    header
      .toLowerCase()
      .replace(/\W/g, '_')
}

const CLEAN_OUTLIERS_DIFF = 30


export default function App() {
  const areaRef = useRef<null | HTMLDivElement>(null)

  const videoRef = useRef<HTMLVideoElement>(null)




  const [data, setData] = useState<any | null>(null)
  const [customizedData, setCustomizedData] = useState<any | null>(null)
  const [tableData, setTableData] = useState<any>(null)
  const [summationGraph, setSummationGraph] = useState<null | any[]>(null)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [columns, setColumns] = useState<any>(null)

  const [triedDemo, setTriedDemo] = useState(false)
  const [meanReplaysCount, setMeanReplaysCount] = useState<[number, number]>([0, 10])
  const [highestReplaysCount, setHighestReplaysCount] = useState<[number, number]>([0, 100])
  const [totalWatchDuration, setTotalWatchDuration] = useState<[number, number]>([0, 600])

  useEffect(() => {
    if (!data) return

    let columns = [...Object.keys(data[0]), 'total_watch_duration', 'highest_replays_count', 'mean_replays_count'].map(key => {
      return {
        name: key.split('_').map(word => capitalize(word)).join(' '),
        key: key,
        selector: (row: { [x: string]: any; }) => row[key],
        sortable: true,
        // ...(key === 'time' && {
        //   format : (row: any) => moment(Date.now() - row.time).format('lll')
        // })
      }
    }).filter(field => !['watchgraph', 'event_name', 'time'].includes(field.key))

    setColumns(columns)

    let updateData = data
    updateData = updateData.map((row: any) => {

      row.total_watch_duration = sum(row.watchgraph)
      row.highest_replays_count = max(row.watchgraph)
      row.mean_replays_count = Math.floor(mean(row.watchgraph) * 100) / 100
      return row
    }).filter((row: any) => row.highest_replays_count < CLEAN_OUTLIERS_DIFF)

    setCustomizedData(updateData)
    setTableData(updateData)
  }, [data])

  useEffect(() => {
    if(!customizedData) return
    let filtered = customizedData

    filtered = filtered.filter((row: any) => row.tried_demo === triedDemo)
    filtered = filtered.filter((row: any) => row.total_watch_duration >= totalWatchDuration[0] && row.total_watch_duration <= totalWatchDuration[1])
    filtered = filtered.filter((row: any) => row.highest_replays_count >= highestReplaysCount[0] && row.highest_replays_count <= highestReplaysCount[1])

    setTableData(filtered)

    const summationArray: {
      sum: number,
      users: number,
      position: number
    }[] = []

    filtered.forEach((row: any) => {
      row.watchgraph.forEach((val: number, moment: number) => {
        // Total summation for each sec records.
        while (moment >= summationArray.length) summationArray.push({
          sum: 0,
          users: 0,
          position: moment
        })

        summationArray[moment].sum += val
        summationArray[moment].users += (val != 0) ? 1 : 0
      });
    });

    setSummationGraph(summationArray)

    // if (areaRef.current) areaRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [triedDemo, totalWatchDuration, highestReplaysCount])



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


                const summationArray: { sum: number, users: number }[] = []
                // let userScores: {
                //   name: string | any,
                //   score: number,
                //   distinct_id: string
                // }[]


                data.forEach(row => {
                  const arr: Array<number> = row.watchgraph


                  arr.forEach((reps, position) => {

                    // Total summation for each sec records.
                    while (position >= summationArray.length) summationArray.push({
                      sum: 0,
                      users: 0
                    })

                    summationArray[position].sum += reps
                    if (reps > 0) summationArray[position].users++
                  })
                })

                const summationGraph: SetStateAction<any[] | null> = []

                summationArray.forEach(({ sum, users }, position) => summationGraph.push({
                  sum,
                  users,
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
          <>
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
                    ref={areaRef}
                  >

                    {summationGraph &&
                      <>
                        {/* <Text size='lg' ref={areaRef} color='black'>Tutorial viewership</Text> */}
                        <ResponsiveContainer>
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

                            </XAxis>
                            <YAxis dataKey="sum">
                              <Label
                                value="Views"
                                position="insideLeft"
                                angle={-90}
                                style={{ textAnchor: "middle" }}
                              />
                            </YAxis>
                            <YAxis dataKey="users">
                              <Label
                                value="Views"
                                position="insideLeft"
                                angle={-90}
                                style={{ textAnchor: "middle" }}
                              />
                            </YAxis>
                            <Tooltip
                              label="views"
                              formatter={(value, name) => `${value} ${name === "users" ? "unique users" : "total views"}`}
                              labelFormatter={(value, name) => `At ${value} seconds`}
                            />
                            <Area type="monotone" dataKey="users" stroke="#2C514C" fill="#2C514C" />
                            <Area type="monotone" dataKey="sum" stroke="#8884d8" fill="#8884d8" />
                          </AreaChart>
                        </ResponsiveContainer>
                        <br />
                        <Divider color="gray" />
                      </>
                    }

                  </div>
                }
              </div>
            </div>
            {(columns && tableData) &&
              <div className=" space-y-4 text-black">
                {/* Data Table */}
                <div className="px-2 space-y-3">
                  <Switch
                    label="Used Picture in Picture"
                    checked={triedDemo}
                    onChange={() => {
                      const status = !triedDemo
                      setTriedDemo(status)

                    }}
                  />
                  <br />
                  <div>
                    <Text color="white">Total watch duration : {totalWatchDuration[0]} - {totalWatchDuration[1]} seconds</Text>
                    <RangeSlider
                      label="Total watch duration"
                      min={0}
                      max={600}
                      value={totalWatchDuration}
                      onChange={(val) => {
                        setTotalWatchDuration(val)

                      }}
                    />
                  </div>
                  <div>
                    <Text color="white">Highest Replays count : Replayed {highestReplaysCount[0]} - {highestReplaysCount[1]} times</Text>
                    <RangeSlider
                      label="Highest Replays count"
                      min={0}
                      max={100}
                      value={highestReplaysCount}
                      onChange={(val) => {
                        console.log(customizedData)
                        setHighestReplaysCount(val)

                      }}
                    />
                  </div>
                  {/* <div>
                  <Text color="white">Mean Replays count : Replayed {meanReplaysCount[0]} - {meanReplaysCount[1]} times </Text>
                  <RangeSlider
                    label="Mean Replays count"
                    min={0}
                    max={10}
                    value={meanReplaysCount}
                    onChange={(val) => {
                      console.log(meanReplaysCount)
                      setMeanReplaysCount(val)
                      setTableData(customizedData.filter((row: any) => row.mean_replays_count >= val[0] && row.mean_replays_count <= val[1]))
                    }}
                  />
                </div> */}
                </div>
                <DataTable
                  columns={columns}
                  data={tableData}
                  sortIcon={<IconSquareArrowDown />}
                  pagination
                  onRowClicked={(row: {
                    watchgraph: Array<number>
                  }) => {
                    const graphArray = new Array
                    row.watchgraph.forEach((value, position) => {
                      graphArray.push({
                        sum: value,
                        position
                      })
                    });
                    if (areaRef.current) areaRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    console.log("graphArray for current user", graphArray)
                    setSummationGraph(graphArray)
                  }}

                  pointerOnHover
                  highlightOnHover
                />
              </div>
            }
          </>
        }

      </ThemeProvider>
    </Hotkeys>
  );
}
