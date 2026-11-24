// Written by design/make_job_diagram.py. To change the drawing, change that script and run design/build.sh.
import { settings } from "@/lib/settings";

/** A stage name from the settings file, so the drawing follows the file as the waiting screen does. */
const stage = (index: number, fallback: string) => settings.reportJob.stages[index]?.label ?? fallback;

/**
 * The phone and the server on one timeline: the job lives on the server, the page only asks which
 * stage it has reached, so a phone that drops out loses nothing. Solid marks run in this sample;
 * dashed ones are the real build only.
 */
export function ReportJobDiagram({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 350 504"
      role="img"
      aria-labelledby="report-job-title report-job-desc"
      className={className}
    >
      <title id="report-job-title">What happens to the report job when the phone drops out</title>
      <desc id="report-job-desc">{`Two lines run down the drawing: the customer's phone and the server. The last answer is sent and saved, and the report job starts on the server. Every 2 seconds the page asks the server which stage the job has reached: ${stage(0, "Reading your answers")}, then ${stage(1, "Drawing your profile")}, then ${stage(2, "Writing your report")}. Partway through, the phone drops out: the screen locks, the signal drops or the tab closes. The phone's line stops there. The server's line carries on through the remaining stages until the report is ready. Later the same code opens the report, on this phone or any other device. Three steps are marked as real build only: the model writes the report, a stalled job is restarted, and the report is also sent by email.`}</desc>
      <text x={1} y={12} fontSize={12} fontWeight={600} letterSpacing={0.9} fill="#5B6470">
        {"CUSTOMER'S PHONE"}
      </text>
      <text x={29} y={33} fontSize={12} fontWeight={600} letterSpacing={0.9} fill="#1F5C55">
        {"SERVER"}
      </text>
      <line x1={13} y1={80} x2={41} y2={80} stroke="#B4AEA3" strokeWidth={1} />
      <line x1={13} y1={92} x2={41} y2={92} stroke="#B4AEA3" strokeWidth={1} />
      <line x1={13} y1={104} x2={41} y2={104} stroke="#B4AEA3" strokeWidth={1} />
      <line x1={13} y1={116} x2={41} y2={116} stroke="#B4AEA3" strokeWidth={1} />
      <line x1={13} y1={128} x2={41} y2={128} stroke="#B4AEA3" strokeWidth={1} />
      <line x1={13} y1={140} x2={41} y2={140} stroke="#B4AEA3" strokeWidth={1} />
      <line x1={13} y1={152} x2={41} y2={152} stroke="#B4AEA3" strokeWidth={1} />
      <line x1={13} y1={164} x2={41} y2={164} stroke="#B4AEA3" strokeWidth={1} />
      <line x1={13} y1={188} x2={41} y2={188} stroke="#B4AEA3" strokeWidth={1} />
      <line x1={13} y1={200} x2={41} y2={200} stroke="#B4AEA3" strokeWidth={1} />
      <line x1={13} y1={212} x2={41} y2={212} stroke="#B4AEA3" strokeWidth={1} />
      <line x1={13} y1={176} x2={41} y2={176} stroke="#5B6470" strokeWidth={1.5} />
      <line x1={13} y1={20} x2={13} y2={224} stroke="#5B6470" strokeWidth={1.5} />
      <line x1={13} y1={408} x2={13} y2={456} stroke="#5B6470" strokeWidth={1.5} />
      <line x1={41} y1={41} x2={41} y2={456} stroke="#1F5C55" strokeWidth={2} />
      <line x1={7} y1={224} x2={19} y2={224} stroke="#A8472B" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={7} y1={408} x2={19} y2={408} stroke="#A8472B" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={13} y1={68} x2={28} y2={68} stroke="#1F2A37" strokeWidth={1.5} />
      <path d="M35 68L28 64L28 72Z" fill="#1F2A37" />
      <circle cx={13} cy={68} r={4.5} fill="#5B6470" />
      <circle cx={41} cy={68} r={4.5} fill="#1F5C55" />
      <text x={64} y={73} fontSize={14} fontWeight={600} fill="#1F2A37">
        {"Last answer sent"}
      </text>
      <text x={64} y={92} fontSize={13} fill="#5B6470">
        {"Saved, then the report job starts."}
      </text>
      <circle cx={41} cy={116} r={4.75} fill="#FAF7F2" stroke="#1F5C55" strokeWidth={1.5} strokeDasharray="2.6 2.2" />
      <text x={64} y={121} fontSize={14} fontWeight={600} fill="#5B6470">
        {"The model writes the report"}
      </text>
      <line x1={41} y1={146} x2={51} y2={146} stroke="#1F5C55" strokeWidth={2} />
      <text x={64} y={151} fontSize={14} fontWeight={600} fill="#1F2A37">
        {stage(0, "Reading your answers")}
      </text>
      <text x={64} y={181} fontSize={14} fontWeight={600} fill="#1F2A37">
        {"The page asks which stage"}
      </text>
      <text x={64} y={200} fontSize={13} fill="#5B6470">
        {"Every 2 seconds, and shows its name."}
      </text>
      <text x={64} y={229} fontSize={14} fontWeight={600} fill="#1F2A37">
        {"The phone drops out"}
      </text>
      <text x={64} y={248} fontSize={13} fill="#5B6470">
        {"Screen locks, signal drops, tab closes."}
      </text>
      <line x1={41} y1={272} x2={51} y2={272} stroke="#1F5C55" strokeWidth={2} />
      <text x={64} y={277} fontSize={14} fontWeight={600} fill="#1F2A37">
        {stage(1, "Drawing your profile")}
      </text>
      <line x1={41} y1={302} x2={51} y2={302} stroke="#1F5C55" strokeWidth={2} />
      <text x={64} y={307} fontSize={14} fontWeight={600} fill="#1F2A37">
        {stage(2, "Writing your report")}
      </text>
      <circle cx={41} cy={332} r={4.75} fill="#FAF7F2" stroke="#1F5C55" strokeWidth={1.5} strokeDasharray="2.6 2.2" />
      <text x={64} y={337} fontSize={14} fontWeight={600} fill="#5B6470">
        {"A stalled job is restarted"}
      </text>
      <circle cx={41} cy={362} r={5.5} fill="#1F5C55" />
      <text x={64} y={367} fontSize={14} fontWeight={600} fill="#1F2A37">
        {"Report ready"}
      </text>
      <circle cx={41} cy={392} r={4.75} fill="#FAF7F2" stroke="#1F5C55" strokeWidth={1.5} strokeDasharray="2.6 2.2" />
      <text x={64} y={397} fontSize={14} fontWeight={600} fill="#5B6470">
        {"Sent by email as well"}
      </text>
      <line x1={41} y1={428} x2={26} y2={428} stroke="#1F2A37" strokeWidth={1.5} />
      <path d="M19 428L26 424L26 432Z" fill="#1F2A37" />
      <circle cx={13} cy={428} r={4.5} fill="#5B6470" />
      <circle cx={41} cy={428} r={4.5} fill="#1F5C55" />
      <text x={64} y={433} fontSize={14} fontWeight={600} fill="#1F2A37">
        {"The same code opens it"}
      </text>
      <text x={64} y={452} fontSize={13} fill="#5B6470">
        {"On this phone or any other device."}
      </text>
      <line x1={0} y1={469} x2={350} y2={469} stroke="#DDD5C7" strokeWidth={1} />
      <circle cx={6} cy={485.5} r={4.5} fill="#1F5C55" />
      <text x={18} y={490} fontSize={13} fill="#5B6470">
        {"Runs in this sample"}
      </text>
      <circle cx={176} cy={485.5} r={4.75} fill="#FAF7F2" stroke="#1F5C55" strokeWidth={1.5} strokeDasharray="2.6 2.2" />
      <text x={188} y={490} fontSize={13} fill="#5B6470">
        {"Real build only"}
      </text>
    </svg>
  );
}
