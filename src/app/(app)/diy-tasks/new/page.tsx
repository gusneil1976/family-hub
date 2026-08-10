import { DiyTaskForm } from "../diy-task-form";
import { createDiyTask } from "./actions";

export default function NewDiyTaskPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        New DIY task
      </h1>
      <DiyTaskForm action={createDiyTask} submitLabel="Create" />
    </div>
  );
}
