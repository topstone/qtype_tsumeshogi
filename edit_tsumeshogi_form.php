<?php
defined('MOODLE_INTERNAL') || die();

class qtype_tsumeshogi_edit_form extends question_edit_form {

    protected function definition_inner($mform) {
        $mform->addElement('textarea', 'sfen',
            get_string('sfen', 'qtype_tsumeshogi'),
            ['rows' => 2, 'cols' => 60]
        );
        $mform->setType('sfen', PARAM_RAW);
        $mform->addRule('sfen', null, 'required', null, 'client');
        $mform->addHelpButton('sfen', 'sfen', 'qtype_tsumeshogi');

        $mform->addElement('text', 'correctanswer',
            get_string('correctanswer', 'qtype_tsumeshogi'),
            ['size' => 12]
        );
        $mform->setType('correctanswer', PARAM_RAW_TRIMMED);
        $mform->addRule('correctanswer', null, 'required', null, 'client');
        $mform->addHelpButton('correctanswer', 'correctanswer', 'qtype_tsumeshogi');
    }

    public function data_preprocessing($question) {
        $question = parent::data_preprocessing($question);
        if (!empty($question->options)) {
            $question->sfen          = $question->options->sfen;
            $question->correctanswer = $question->options->correctanswer;
        }
        return $question;
    }

    public function qtype() {
        return 'tsumeshogi';
    }
}
