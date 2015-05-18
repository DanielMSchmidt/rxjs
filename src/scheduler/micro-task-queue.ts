import getBoundNext from '../util/get-bound-next';
import Scheduler from './scheduler';

/** 
  A micro task queue specialized for scheduler use.
  @class MicroTaskQueue
*/
export default class MicroTaskQueue {
  private _queue: Array<MicroTask>
  public isProcessing:Boolean
  public isDisposed:Boolean
  private _flushNext:Function;

  constructor() {
    this._queue = [];
    this.isProcessing = false;
    this.isDisposed = false;
    this._flushNext = getBoundNext(this.flush.bind(this));
  }

  /**
    Enqueues a task to be run based on the state, work and scheduler passed
    @method enqueue
    @param state {Object} the state to run the work against.
    @param work {Function} the work to be done
    @param scheduler {Scheduler} the scheduler the work is being done for.
    @return {MicroTask} a micro task which is disposable.
  */
  enqueue(state:any, work:(Scheduler, any) => any, scheduler:Scheduler) {
    var task = new MicroTask(this, state, work, scheduler);
    this._queue.push(task);
    this.scheduleFlush();
    return task;
  }

  /**
    Removes a micro task from the queue
    @method dequeue
    @param task {MicroTask} the task to dequeue
  */
  dequeue(task) {
    this._queue.splice(this._queue.indexOf(task), 1);
  }

  /**
    Clears the queue and prevents any delayed execution of tasks.
    @method dispose
  */
  dispose() {
    this._queue.length = 0;
    this.isProcessing = false;
    this.isDisposed = true;
  }

  /**
    Schedules a flush to be called as a micro task if possible. Otherwise as a setTimeout.
    See `utils/get-bound-next'
    @method scheduleFlush
  */
  scheduleFlush() {
    if(!this.isProcessing) {
      this.isProcessing = true;
      this._flushNext();
    }
  }

  /**
    Processes the queue of tasks.
    @method flush
  */
  flush() {
    var start = Date.now();
    while(this._queue.length > 0) {
      var task = this._queue.shift();
      task.work(task.scheduler, task.state);
    }

    if(this._queue.length > 0) {
      this._flushNext();
    } else {
      this.isProcessing = false;
    }
  }
}

/**
  A structure for defining a task on a MicroTaskQueue
  @class MicroTask
*/
class MicroTask {
  constructor(public queue:MicroTaskQueue, public state:any, 
    public work:(Scheduler, any) => any, public scheduler:Scheduler) {
  }

  /**
    dequeues the task from it's queue
    @method dispose
  */
  dispose() {
    this.queue.dequeue(this);
  }
}

