import { createAppController } from "./app-controller.js";
import { createTaskStorage } from "./local-task-storage.js";
import { createTaskView } from "./task-view.js";

const view = createTaskView();
const storage = createTaskStorage();
const controller = createAppController({
  storage,
  render: (state) => view.render(state),
  createId: () => crypto.randomUUID(),
});
view.connect(controller);
controller.start();
