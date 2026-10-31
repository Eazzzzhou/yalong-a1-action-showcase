import * as T from 'three';

const PARTS = [
  // Arrange the groups in three readable tiers instead of scattering them
  // radially. The lower shell stays centered and every part remains above the
  // tabletop while the left/right modules keep a clear visual rhythm.
  ['case', [-.02, .02, -.02], [0, 0, -.015]],
  ['lid', [.02, .34, .02], [.025, -.02, .018]],
  ['panel', [0, .19, .035], [0, 0, .012]],
  ['arm4-rebuilt-root', [-.34, .15, .015], [.025, -.035, -.025]],
  ['arm_mount', [-.30, .04, -.01], [0, 0, -.02]],
  ['gimbal', [.34, .15, .02], [-.025, .035, .025]],
  ['compute', [-.32, .34, .04], [.03, -.025, .02]],
  ['development_board', [.32, .34, .015], [-.03, .03, -.02]],
  ['controls', [.48, .22, .03], [0, .025, .025]],
  ['sensor_grid', [.02, .43, .07], [0, -.02, .018]],
  ['speaker', [.48, .42, .04], [.02, .03, .025]],
];

function smooth(t) { return t * t * (3 - 2 * t); }

export function createExploder({teaching, onStatus = () => {}}) {
  const records = [];
  const objects = teaching?.objects;
  if (!objects) return {update() {}, toggle() {}, collapse() {}, get exploded() { return false; }};
  for (const [name, offset, turn] of PARTS) {
    const object = objects.get(name);
    if (!object) continue;
    records.push({
      name, object,
      basePosition: object.position.clone(),
      baseQuaternion: object.quaternion.clone(),
      targetPosition: object.position.clone().add(new T.Vector3(...offset)),
      targetQuaternion: object.quaternion.clone().multiply(new T.Quaternion().setFromEuler(new T.Euler(...turn))),
    });
  }
  let progress = 0, goal = 0, last = performance.now();
  function apply(value) {
    const t = smooth(value);
    for (const record of records) {
      record.object.position.lerpVectors(record.basePosition, record.targetPosition, t);
      record.object.quaternion.slerpQuaternions(record.baseQuaternion, record.targetQuaternion, t);
    }
  }
  function setGoal(next) {
    goal = next ? 1 : 0;
    onStatus(goal ? '正在展开功能模块…' : '正在复位爆炸拆解…');
  }
  return {
    update(now = performance.now()) {
      const dt = Math.min(.05, Math.max(0, (now - last) / 1000));
      last = now;
      if (Math.abs(progress - goal) < .001) return;
      progress += (goal - progress) * Math.min(1, dt * 5.5);
      if (Math.abs(progress - goal) < .001) progress = goal;
      apply(progress);
      if (progress === goal) onStatus(goal ? '爆炸拆解已展开：可切换远／中／近景' : '已复位：可继续查看功能动作');
    },
    toggle() {
      if (teaching?.state?.busy) { onStatus('请先等待当前动作完成，再进行爆炸拆解'); return; }
      setGoal(goal < .5);
    },
    collapse() { setGoal(false); },
    get exploded() { return goal > .5; },
    get progress() { return progress; },
    get count() { return records.length; },
  };
}
