<?php
defined('MOODLE_INTERNAL') || die();

class qtype_tsumeshogi_renderer extends qtype_renderer {

    public function formulation_and_controls(question_attempt $qa, question_display_options $options) {
        $question   = $qa->get_question();
        $inputname  = $qa->get_qt_field_name('answer');
        $currentval = $qa->get_last_qt_var('answer', '');
        $readonly   = $options->readonly ? 'true' : 'false';
        $slot       = (int)$qa->get_slot();
        $boardid    = 'shogi-board-' . $slot;

        // Board container — JS reads data-* to initialise
        $html = html_writer::tag('div', '', [
            'id'            => $boardid,
            'class'         => 'qtype_tsumeshogi_board',
            'data-sfen'     => $question->sfen,
            'data-input'    => $inputname,
            'data-readonly' => $readonly,
        ]);

        // Hidden input — JS writes USI move here for Moodle to collect
        $html .= html_writer::empty_tag('input', [
            'type'  => 'hidden',
            'name'  => $inputname,
            'id'    => $inputname,
            'value' => s($currentval),
        ]);

        if ($currentval !== '') {
            $html .= html_writer::tag('p',
                get_string('yourAnswerWas', 'qtype_tsumeshogi', s($currentval))
            );
        }

        // Build JS URL
        $jsurl = (new moodle_url('/question/type/tsumeshogi/amd/src/board.js'))->out(false);

        // Inline <script>: load board.js once per page, then call tsumeshogi_init(slot).
        // Using a dynamic <script> element avoids all AMD/require.js timing issues.
        // window.__tsumeshogi_loaded guards against loading the library twice when
        // multiple questions appear on the same page.
        $initjs  = "(function(slot, jsurl) {\n";
        $initjs .= "  function run() { if (typeof tsumeshogi_init === 'function') tsumeshogi_init(slot); }\n";
        $initjs .= "  if (!window.__tsumeshogi_loaded) {\n";
        $initjs .= "    window.__tsumeshogi_loaded = true;\n";
        $initjs .= "    var s = document.createElement('script');\n";
        $initjs .= "    s.src = jsurl;\n";
        $initjs .= "    s.onload = run;\n";
        $initjs .= "    document.head.appendChild(s);\n";
        $initjs .= "  } else {\n";
        $initjs .= "    (document.readyState === 'loading')\n";
        $initjs .= "      ? document.addEventListener('DOMContentLoaded', run)\n";
        $initjs .= "      : run();\n";
        $initjs .= "  }\n";
        $initjs .= "})(" . $slot . ", " . json_encode($jsurl) . ");\n";

        $html .= html_writer::tag('script', $initjs);

        return $html;
    }

    public function correct_response(question_attempt $qa) {
        $question = $qa->get_question();
        return get_string('correctanswer', 'qtype_tsumeshogi') . ': ' .
               html_writer::tag('code', s($question->correctanswer));
    }
}
