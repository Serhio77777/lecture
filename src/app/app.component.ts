import { Component, NgZone, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
const profilingZoneSpec = (function () {
  const timeDirty = 0;
  let time = 0;
  // Если доступен, то используем более точные таймер
  const timer = performance ?
    performance.now.bind(performance) :
    Date.now.bind(Date);
  let timerDirty = timer();
  return {
    beforeTask: function () {
      console.log('Before task');
    },
    onInvokeTask: function (delegate, current, target, task, applyThis, applyArgs) {
      this.start = timer();
      delegate.invokeTask(target, task, applyThis, applyArgs);
      time += timer() - this.start;
    },
    time: function () {
      console.log(23123, performance)
      return Math.floor(time * 100) / 100 / 1000 + 'с';
    },
    dirtyTime: function () {
      return Math.floor((timer() - timerDirty) * 100) / 100 / 1000 + 'с';
    },
    reset: function () {
      time = 0;
      timerDirty = timer();
    },
    afterTask: function () {
      console.log('After task');
    }
  };
}());

@Component({
  selector: 'lec-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public title = 'lecture';

  public progress: number = 0;
  public counter: number = 0;
  public outputData: number[] = [34,2,4,5543];
  public label: string;

  constructor(private _ngZone: NgZone) { }

  // Loop inside the Angular zone
  // so the UI DOES refresh after each setTimeout cycle
  public processWithinAngularZone(): void {
    this.label = 'inside';
    this.progress = 0;
    this._increaseProgress(() => console.log('Inside Done!'));
  }

  // Loop outside of the Angular zone
  // so the UI DOES NOT refresh after each setTimeout cycle
  public processOutsideOfAngularZone(): void {
    this.label = 'outside';
    this.progress = 0;
    this._ngZone.runOutsideAngular(() => {
      this._increaseProgress(() => {
        // reenter the Angular zone and display done
        this._ngZone._inner.fork(profilingZoneSpec).run(() => { 
          profilingZoneSpec.reset()
          console.log('Outside Done!', profilingZoneSpec.time(), profilingZoneSpec.dirtyTime()); 
        })
        // this._ngZone.run(() => { console.log('Outside Done!'); });
      });
    });
  }

  private _increaseProgress(doneCallback: () => void): void {
    this.progress += 1;
    console.log(`Current progress: ${this.progress}%`);

    if (this.progress < 100) {
      window.setTimeout(() => this._increaseProgress(doneCallback), 10);
    } else {
      doneCallback();
    }
  }

  public clickMe (): void {
    this.counter++;
    if (this.counter > 5) {
      this._ngZone._inner.fork(profilingZoneSpec).run(() => this.errorShow(this))
    }
  }

  public errorShow(self): void {
    setTimeout(() => {
      profilingZoneSpec.reset()
      self.outputData = [3,2,3,4,5,6,7,8,9,0,7,5,78,4,3,4324,45,5,345]
      console.log('Outside Done!', profilingZoneSpec.time(), profilingZoneSpec.dirtyTime());
      throw new Error('test');
    }, 100);
  }

  public ngOnInit (): void {
    this._ngZone.onError.subscribe((error) => console.log('Error', error));
    this._ngZone.onStable.subscribe((data) => console.log('stable', data, this._ngZone, this._ngZone._inner._zoneDelegate));
    this._ngZone.onUnstable.subscribe((data) => console.log('onUnstable', data));
    this._ngZone.onMicrotaskEmpty.subscribe((data) => console.log('onMicrotaskEmpty', data));
  }
}
